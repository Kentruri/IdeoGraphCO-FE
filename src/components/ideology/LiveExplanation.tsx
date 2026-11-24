"use client";

import { useEffect, useState } from "react";
import { Square, Sparkles } from "lucide-react";

import { ExplanationReviewForm } from "@/components/ideology/ExplanationReviewForm";
import { Button } from "@/components/ui/button";
import {
  useExplanationStream,
  type ExplanationRequest,
  type ExplanationStreamErrorCode,
  type ExplanationStreamState,
} from "@/hooks/useExplanationStream";
import { cn } from "@/lib/utils";
import {
  IDEOLOGY_DISPLAY_ORDER,
  IDEOLOGY_META,
  type IdeologyClass,
} from "@/types/ideology";

interface LiveExplanationProps {
  /** El titular y el texto exactos que se clasificaron. */
  request: ExplanationRequest;
  /** Veredicto que se ve en la mesa, para avisar si el stream trae otro. */
  predicted: IdeologyClass;
  modelVersion: string;
  className?: string;
}

const ERROR_COPY: Record<ExplanationStreamErrorCode, string> = {
  busy: "Ya hay una explicación en curso en el servidor. Intente de nuevo cuando termine.",
  not_political:
    "El filtro de politicidad no aceptó el texto, así que no se explica.",
  classifier_unavailable:
    "El clasificador no respondió. Intente de nuevo en unos minutos.",
  explainer_unavailable:
    "La IA que redacta las explicaciones no está disponible ahora (sin sesión o sin cuota).",
  explanation_failed:
    "La IA no logró una explicación que cumpla las reglas. Puede intentarlo de nuevo.",
  invalid_output:
    "La explicación llegó con un formato inesperado y no se muestra.",
  interrupted: "La conexión se cortó antes de terminar la explicación.",
  disabled: "La explicación en vivo no está activa en este servidor.",
  network: "No se pudo conectar con el servidor.",
};

function useElapsedSeconds(startedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
}

/** Lo que oye un lector de pantalla: los cambios de fase, nunca cada trozo. */
function announcement(state: ExplanationStreamState): string {
  switch (state.phase) {
    case "connecting":
    case "thinking":
      return "Leyendo el texto para explicar la clasificación.";
    case "writing":
      return "Redactando la explicación.";
    case "done":
      return "Explicación lista.";
    case "error":
      return ERROR_COPY[state.error.code];
    case "stopped":
      return "Explicación detenida.";
    default:
      return "";
  }
}

/**
 * Explicación en vivo bajo el veredicto de la mesa: el párrafo aparece
 * mientras la IA lo escribe (SSE) y, cuando termina y pasa la validación del
 * cliente, se muestra con su rótulo y llena la ficha de revisión. Como la
 * explicación del detalle, no se presenta como el razonamiento del modelo.
 */
export function LiveExplanation({
  request,
  predicted,
  modelVersion,
  className,
}: LiveExplanationProps) {
  const { state, start, stop } = useExplanationStream();
  const streaming =
    state.phase === "connecting" ||
    state.phase === "thinking" ||
    state.phase === "writing";
  const elapsed = useElapsedSeconds(streaming ? state.startedAt : null);
  const classification =
    state.phase === "thinking" || state.phase === "writing" || state.phase === "done"
      ? state.classification
      : null;
  const changed =
    classification !== null &&
    (classification.label !== predicted ||
      classification.model_version !== modelVersion);

  return (
    <section
      aria-labelledby="explicacion-en-vivo"
      aria-busy={streaming}
      // El veredicto entero es una región aria-live: aquí no, para que el
      // lector no lea cada trozo del párrafo. Los avisos van en el status.
      aria-live="off"
      className={cn("border-t border-border pt-5", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h4 id="explicacion-en-vivo" className="text-sm font-semibold">
          Por qué esta clasificación
        </h4>
        {state.phase === "done" && (
          <p className="font-mono text-[11px] text-muted-foreground">
            IA: {state.explanation.model}, prompt v{state.explanation.prompt_version}
          </p>
        )}
      </div>

      <p role="status" className="sr-only">
        {announcement(state)}
      </p>

      {changed && classification && (
        <p className="mt-2 border-l-2 border-foreground pl-3 text-xs leading-5">
          Al explicar, el modelo devolvió otra clasificación (
          {IDEOLOGY_META[classification.label].label}, {classification.model_version}). La
          explicación corresponde a esa.
        </p>
      )}

      {(state.phase === "idle" || state.phase === "stopped") && (
        <div className="mt-2 space-y-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {state.phase === "stopped"
              ? "Explicación detenida."
              : "La redacta una IA a partir del texto y del codebook de las ocho clases. Puede tardar hasta un minuto."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => start(request)}
            className="gap-2"
          >
            <Sparkles aria-hidden className="size-3.5" />
            {state.phase === "stopped" ? "Explicar de nuevo" : "Explicar esta clasificación"}
          </Button>
        </div>
      )}

      {streaming && (
        <div className="mt-2">
          {state.phase === "writing" ? (
            <p className="text-sm leading-6 text-pretty">
              {state.draft}
              <span
                aria-hidden
                className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] bg-foreground motion-safe:animate-caret-blink"
              />
            </p>
          ) : (
            <ThinkingDots />
          )}

          {state.phase !== "connecting" && state.retryReason && (
            <p className="mt-3 font-mono text-[11px] leading-5 text-muted-foreground">
              La redacción anterior no cumplió una regla ({state.retryReason}). Se
              redacta de nuevo.
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {state.phase === "writing"
                ? "redactando"
                : "leyendo el texto con el codebook"}
              , {elapsed} s
            </p>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={stop}
              className="gap-1.5"
            >
              <Square aria-hidden className="size-2.5 fill-current" />
              Detener
            </Button>
          </div>
        </div>
      )}

      {state.phase === "done" && (
        <>
          <p className="mt-1.5 text-sm leading-6 text-pretty">{state.explanation.text}</p>
          <p className="mt-2 font-mono text-[11px] leading-5 text-muted-foreground">
            {state.explanation.disclaimer}
          </p>
          <ExplanationReviewForm
            className="mt-6"
            request={request}
            classification={state.classification}
            explanation={state.explanation}
          />
        </>
      )}

      {state.phase === "error" && (
        <div className="mt-2 space-y-3">
          <p className="text-sm leading-6">{ERROR_COPY[state.error.code]}</p>
          {state.error.reason && state.error.code !== "explanation_failed" && (
            <p className="font-mono text-[11px] leading-5 text-muted-foreground">
              motivo: {state.error.reason}
            </p>
          )}
          {state.error.code !== "disabled" && state.error.code !== "not_political" && (
            <Button type="button" variant="outline" size="sm" onClick={() => start(request)}>
              Intentar de nuevo
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/** Los 8 puntos del sistema, latiendo mientras la IA lee (quietos con reduced motion). */
function ThinkingDots() {
  return (
    <div aria-hidden className="flex h-6 items-center gap-1.5">
      {IDEOLOGY_DISPLAY_ORDER.map((ideologyClass, index) => (
        <span
          key={ideologyClass}
          className="size-1.5 rounded-full opacity-60 motion-safe:animate-pulse"
          style={{
            backgroundColor: IDEOLOGY_META[ideologyClass].cssVar,
            animationDelay: `${index * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}
