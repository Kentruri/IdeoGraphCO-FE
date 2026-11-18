"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { z } from "zod";

import { readServerSentEvents } from "@/lib/sse";
import {
  classificationEventSchema,
  deltaEventSchema,
  errorEventSchema,
  liveExplanationFor,
  retryEventSchema,
  statusEventSchema,
  type ClassificationEvent,
  type ErrorEvent,
  type LiveExplanation,
} from "@/schemas/explanation";
import { CLASSIFIER_API_URL } from "@/store/services/classifier.api";

/**
 * Explicación en vivo de la mesa de redacción (`POST /api/v1/explain`).
 *
 * Lee el stream SSE con `fetch` y valida cada evento con Zod antes de usarlo:
 * un evento que no cumple el contrato corta la conexión (y con ella el
 * `claude -p` del servidor) en vez de pintar algo a medias. El párrafo crece
 * con cada `delta`; `retry` lo borra; el evento final solo se acepta si su
 * primera clase es la predicha en ese mismo stream. Detener o desmontar el
 * componente aborta la petición.
 */

/** Por qué terminó sin explicación. Los códigos del servidor y los del cliente. */
export type ExplanationStreamErrorCode =
  | ErrorEvent["code"]
  | "disabled"
  | "invalid_output"
  | "interrupted"
  | "network";

export interface ExplanationStreamError {
  code: ExplanationStreamErrorCode;
  /** Motivo del filtro de politicidad o de la falla, si el servidor lo dio. */
  reason?: string | null;
}

export type ExplanationStreamState =
  | { phase: "idle" }
  | { phase: "connecting"; startedAt: number }
  | {
      phase: "thinking" | "writing";
      startedAt: number;
      classification: ClassificationEvent;
      draft: string;
      /** Regla que rompió el borrador anterior, mientras se redacta otro. */
      retryReason: string | null;
    }
  | { phase: "done"; classification: ClassificationEvent; explanation: LiveExplanation }
  | { phase: "error"; error: ExplanationStreamError }
  | { phase: "stopped" };

type Action =
  | { type: "start"; at: number }
  | { type: "classification"; classification: ClassificationEvent }
  | { type: "status"; phase: "thinking" | "writing" }
  | { type: "delta"; text: string }
  | { type: "retry"; reason: string }
  | { type: "done"; explanation: LiveExplanation }
  | { type: "error"; error: ExplanationStreamError }
  | { type: "stopped" };

function reducer(state: ExplanationStreamState, action: Action): ExplanationStreamState {
  switch (action.type) {
    case "start":
      return { phase: "connecting", startedAt: action.at };
    case "classification":
      if (state.phase !== "connecting") return state;
      return {
        phase: "thinking",
        startedAt: state.startedAt,
        classification: action.classification,
        draft: "",
        retryReason: null,
      };
    case "status":
      if (state.phase !== "thinking" && state.phase !== "writing") return state;
      return { ...state, phase: action.phase };
    case "delta":
      if (state.phase !== "thinking" && state.phase !== "writing") return state;
      return { ...state, phase: "writing", draft: state.draft + action.text };
    case "retry":
      if (state.phase !== "thinking" && state.phase !== "writing") return state;
      return { ...state, phase: "thinking", draft: "", retryReason: action.reason };
    case "done":
      if (state.phase !== "thinking" && state.phase !== "writing") return state;
      return {
        phase: "done",
        classification: state.classification,
        explanation: action.explanation,
      };
    case "error":
      return { phase: "error", error: action.error };
    case "stopped":
      return { phase: "stopped" };
  }
}

export interface ExplanationRequest {
  title: string;
  text: string;
}

/** Resultado de procesar un evento: seguir leyendo o terminar. */
type Step = "continue" | "finished";

class InvalidEvent extends Error {
  constructor(
    readonly event: string,
    readonly issues: z.ZodError["issues"]
  ) {
    super(`Evento «${event}» inválido`);
  }
}

function parse<T>(schema: z.ZodType<T>, event: string, data: string): T {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    throw new InvalidEvent(event, []);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new InvalidEvent(event, parsed.error.issues);
  return parsed.data;
}

export function useExplanationStream() {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });
  const controller = useRef<AbortController | null>(null);

  // Al desmontar (otro texto en la mesa, otra página) no queda nada abierto.
  useEffect(() => () => controller.current?.abort(), []);

  const stop = useCallback(() => {
    if (!controller.current) return;
    controller.current.abort();
    controller.current = null;
    dispatch({ type: "stopped" });
  }, []);

  const start = useCallback(async ({ title, text }: ExplanationRequest) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    dispatch({ type: "start", at: Date.now() });

    const finish = (action: Action) => {
      if (controller.current !== current) return; // otro pedido ya lo reemplazó
      controller.current = null;
      dispatch(action);
    };

    let response: Response;
    try {
      response = await fetch(`${CLASSIFIER_API_URL}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ title, text }),
        signal: current.signal,
      });
    } catch {
      if (!current.signal.aborted) finish({ type: "error", error: { code: "network" } });
      return;
    }
    if (!response.ok || !response.body) {
      const code: ExplanationStreamErrorCode =
        response.status === 503 ? "disabled" : "network";
      finish({ type: "error", error: { code } });
      return;
    }

    let predicted: ClassificationEvent["label"] | null = null;
    const handle = (event: string, data: string): Step => {
      switch (event) {
        case "classification": {
          const classification = parse(classificationEventSchema, event, data);
          predicted = classification.label;
          dispatch({ type: "classification", classification });
          return "continue";
        }
        case "status":
          dispatch({ type: "status", phase: parse(statusEventSchema, event, data).phase });
          return "continue";
        case "delta":
          dispatch({ type: "delta", text: parse(deltaEventSchema, event, data).text });
          return "continue";
        case "retry":
          dispatch({ type: "retry", reason: parse(retryEventSchema, event, data).reason });
          return "continue";
        case "explanation": {
          if (predicted === null) throw new InvalidEvent(event, []);
          const explanation = parse(liveExplanationFor(predicted), event, data);
          finish({ type: "done", explanation });
          return "finished";
        }
        case "error": {
          const error = parse(errorEventSchema, event, data);
          finish({ type: "error", error: { code: error.code, reason: error.reason } });
          return "finished";
        }
        default:
          return "continue"; // eventos nuevos del servidor: se ignoran
      }
    };

    try {
      for await (const { event, data } of readServerSentEvents(response.body)) {
        if (handle(event, data) === "finished") return;
      }
      finish({ type: "error", error: { code: "interrupted" } });
    } catch (error) {
      if (current.signal.aborted) return; // Detener o desmontar: ya se informó
      if (error instanceof InvalidEvent) {
        console.warn(error.message, error.issues);
        current.abort(); // corta el stream: el servidor mata su `claude -p`
        finish({ type: "error", error: { code: "invalid_output" } });
        return;
      }
      finish({ type: "error", error: { code: "interrupted" } });
    }
  }, []);

  return { state, start, stop };
}
