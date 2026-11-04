"use client";

import { useEffect, useRef, useState } from "react";
import { Stamp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { IdeologyDistribution } from "@/components/ideology/IdeologyDistribution";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { SectionOpen } from "@/components/landing/SectionOpen";
import { CountUp } from "@/components/motion/CountUp";
import { Button } from "@/components/ui/button";
import {
  classifyDemoText,
  type DemoSignal,
  type DemoVerdict,
} from "@/lib/demo-classifier";
import { formatProbability } from "@/lib/format";
import {
  CLASSIFIER_API_URL,
  toClassifyFailure,
  useClassifyTextMutation,
} from "@/store/services/classifier.api";
import type { ArticleIdeology, NotPoliticalCategory } from "@/types/article";
import {
  IDEOLOGY_META,
  type IdeologyClass,
  type IdeologyDistribution as Distribution,
} from "@/types/ideology";

const MIN_LENGTH = 40;
// ~30.000 caracteres son los 6.270 tokens que el modelo alcanza a leer.
const MAX_LENGTH = 30000;
const TITLE_MAX_LENGTH = 300;
// Compás de imprenta: el veredicto "se compone" antes de estamparse.
const COMPOSE_MS = 520;
const USES_MODEL = CLASSIFIER_API_URL !== "";

// Cómo leyó el texto el filtro de politicidad del BE, para completar
// "El filtro de politicidad lo leyó como …".
const REJECTED_AS: Record<NotPoliticalCategory, string> = {
  nonpolitical_article: "una nota no política",
  biography_static: "un perfil o una biografía",
  garbage: "un fragmento sin forma de noticia",
};

interface DeskVerdict {
  predicted: IdeologyClass;
  confidence: number;
  distribution: Distribution;
  /** Quién lo emitió: el modelo servido por el BE o el léxico del navegador. */
  origin:
    | { kind: "model"; modelVersion: string }
    | { kind: "demo"; signals: DemoSignal[]; hasSignals: boolean };
}

type DeskState =
  | { phase: "idle" }
  | { phase: "composing" }
  | { phase: "verdict"; verdict: DeskVerdict }
  // Solo si el BE tiene GEMINI_API_KEY: su filtro dijo que no es una
  // noticia política colombiana. Sin clave el BE clasifica todo texto.
  | { phase: "rejected"; category: NotPoliticalCategory; reason: string }
  | { phase: "error" };

function fromModel(ideology: ArticleIdeology): DeskVerdict {
  return {
    predicted: ideology.predicted,
    confidence: ideology.confidence,
    distribution: ideology.probabilities,
    origin: { kind: "model", modelVersion: ideology.modelVersion },
  };
}

function fromDemo(demo: DemoVerdict): DeskVerdict {
  return {
    predicted: demo.predicted,
    confidence: demo.confidence,
    distribution: demo.distribution,
    origin: { kind: "demo", signals: demo.signals, hasSignals: demo.hasSignals },
  };
}

/**
 * Mesa de redacción: el corazón del producto en la portada. El usuario
 * pega un texto político y recibe el veredicto editorial (clase predicha,
 * confianza y distribución). Con NEXT_PUBLIC_CLASSIFIER_API_URL lo emite el
 * modelo del trabajo de grado a través de IdeoGraphCO-BE; sin ella, el
 * léxico de demostración del navegador. El veredicto declara cuál fue.
 */
export function ClassifierDesk({ standalone = false }: { standalone?: boolean }) {
  const reduce = useReducedMotion();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState<DeskState>({ phase: "idle" });
  const composingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Solo cuenta la última petición: un envío anterior que responda tarde
  // no debe pisar el veredicto del texto actual.
  const lastRequest = useRef(0);
  const [classifyText] = useClassifyTextMutation();

  useEffect(
    () => () => {
      if (composingTimer.current) clearTimeout(composingTimer.current);
    },
    []
  );

  const tooShort = text.trim().length > 0 && text.trim().length < MIN_LENGTH;
  const canSubmit = text.trim().length >= MIN_LENGTH;

  function stampAfter(verdict: DeskVerdict, delayMs: number) {
    if (reduce || delayMs <= 0) {
      setState({ phase: "verdict", verdict });
      return;
    }
    composingTimer.current = setTimeout(
      () => setState({ phase: "verdict", verdict }),
      delayMs
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    if (composingTimer.current) clearTimeout(composingTimer.current);
    const request = ++lastRequest.current;

    if (!USES_MODEL) {
      if (!reduce) setState({ phase: "composing" });
      stampAfter(fromDemo(classifyDemoText(text)), COMPOSE_MS);
      return;
    }

    setState({ phase: "composing" });
    const started = Date.now();
    try {
      const result = await classifyText({
        title: title.trim(),
        text: text.trim(),
      }).unwrap();
      if (request !== lastRequest.current) return;
      // Si el modelo responde antes del compás, se espera lo que falta.
      stampAfter(fromModel(result), COMPOSE_MS - (Date.now() - started));
    } catch (error) {
      if (request !== lastRequest.current) return;
      const failure = toClassifyFailure(error);
      setState(
        failure.kind === "not_political"
          ? {
              phase: "rejected",
              category: failure.category,
              reason: failure.reason,
            }
          : { phase: "error" }
      );
    }
  }

  return (
    <section
      id="clasificar"
      aria-label="Mesa de redacción: clasifique un texto"
      className={
        standalone
          ? "mx-auto w-full max-w-7xl scroll-mt-header px-4 pb-24 pt-12 sm:px-6"
          : "mx-auto w-full max-w-7xl scroll-mt-header px-4 py-24 sm:px-6 md:py-32"
      }
    >
      <SectionOpen
        as={standalone ? "h1" : "h2"}
        title="Mesa de redacción"
        lede="Pegue una noticia política colombiana (una nota, un análisis o una columna) y el clasificador repartirá su encuadre entre las ocho clases."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-8">
        {/* La cuartilla */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <label
            htmlFor="titular-a-clasificar"
            className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
          >
            Titular (opcional)
          </label>
          <input
            id="titular-a-clasificar"
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value.slice(0, TITLE_MAX_LENGTH))
            }
            placeholder="El titular de la noticia, si lo tiene…"
            className="mt-2 mb-5 w-full border border-border bg-card px-4 py-3 font-mono text-sm shadow-none outline-none transition-colors duration-150 ease-out-expo placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <label
            htmlFor="texto-a-clasificar"
            className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
          >
            Original para composición
          </label>
          <textarea
            id="texto-a-clasificar"
            value={text}
            onChange={(event) =>
              setText(event.target.value.slice(0, MAX_LENGTH))
            }
            rows={11}
            placeholder="Pegue aquí el texto…"
            className="mt-2 w-full resize-y border border-border bg-card p-4 font-mono text-sm leading-6 shadow-none outline-none transition-colors duration-150 ease-out-expo placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p
              className="font-mono text-[11px] tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {text.trim().length}/{MAX_LENGTH} caracteres
              {tooShort ? ` · mínimo ${MIN_LENGTH}` : ""}
            </p>
            <Button type="submit" disabled={!canSubmit} className="gap-2 px-5">
              <Stamp aria-hidden className="size-4" />
              Clasificar texto
            </Button>
          </div>
        </form>

        {/* El veredicto */}
        <div
          aria-live="polite"
          className="rule-double relative min-h-[22rem] bg-card px-6 pb-6 pt-5 ring-1 ring-border sm:px-7"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Veredicto editorial
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {state.phase === "idle" && (
              <motion.div
                key="idle"
                initial={false}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                className="flex h-full min-h-[17rem] flex-col items-center justify-center gap-3 text-center"
              >
                <div aria-hidden className="flex items-center gap-1.5">
                  {Object.values(IDEOLOGY_META).map((meta) => (
                    <span
                      key={meta.label}
                      className="size-2 rounded-full opacity-35"
                      style={{ backgroundColor: meta.cssVar }}
                    />
                  ))}
                </div>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  El veredicto se imprimirá aquí cuando envíe un texto a la
                  mesa.
                </p>
              </motion.div>
            )}

            {state.phase === "composing" && (
              <motion.div
                key="composing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                className="flex h-full min-h-[17rem] flex-col items-center justify-center gap-4"
              >
                <div aria-hidden className="flex items-center gap-1.5">
                  {Object.values(IDEOLOGY_META).map((meta, index) => (
                    <motion.span
                      key={meta.label}
                      className="size-2 rounded-full"
                      style={{ backgroundColor: meta.cssVar }}
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        delay: index * 0.08,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  componiendo el veredicto…
                </p>
              </motion.div>
            )}

            {state.phase === "verdict" && (
              <VerdictSheet
                key="verdict"
                verdict={state.verdict}
                reduce={reduce ?? false}
              />
            )}

            {state.phase === "rejected" && (
              <motion.div
                key="rejected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                className="flex h-full min-h-[17rem] flex-col items-center justify-center gap-3 text-center"
              >
                <p className="font-display text-xl font-bold tracking-tight">
                  No parece una noticia política
                </p>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  El filtro de politicidad lo leyó como{" "}
                  {REJECTED_AS[state.category]}. La mesa solo clasifica
                  noticias políticas colombianas: el modelo se entrenó con
                  ellas y, con otro texto, el resultado no tendría sentido.
                </p>
                {state.reason && (
                  <p className="max-w-xs font-mono text-[11px] leading-5 text-muted-foreground">
                    motivo del filtro: «{state.reason}»
                  </p>
                )}
              </motion.div>
            )}

            {state.phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                className="flex h-full min-h-[17rem] flex-col items-center justify-center gap-3 text-center"
              >
                <p className="font-display text-xl font-bold tracking-tight">
                  Sin veredicto
                </p>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  El clasificador no respondió. Intente de nuevo en unos
                  minutos.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function VerdictSheet({
  verdict,
  reduce,
}: {
  verdict: DeskVerdict;
  reduce: boolean;
}) {
  const meta = IDEOLOGY_META[verdict.predicted];
  const { origin } = verdict;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4"
    >
      {/* Titular del veredicto: se imprime de izquierda a derecha. */}
      <h3 className="font-display text-3xl font-extrabold tracking-tight motion-safe:animate-ink-print md:text-4xl">
        {meta.label}
      </h3>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-2xl font-semibold tabular-nums">
          {/* Con un decimal, como la distribución: el modelo suele dar
              99,8 % y redondeado a enteros se leería como certeza total. */}
          <CountUp value={verdict.confidence} format={formatProbability} />
        </p>
        <p className="text-sm text-muted-foreground">
          {origin.kind === "model"
            ? "de probabilidad según el modelo"
            : origin.hasSignals
              ? "de confianza del léxico de demostración"
              : "sin señales claras: distribución casi uniforme"}
        </p>
      </div>

      <IdeologyStrip
        probabilities={verdict.distribution}
        className="my-5 h-2"
      />

      <IdeologyDistribution
        probabilities={verdict.distribution}
        predicted={verdict.predicted}
      />

      {origin.kind === "demo" && origin.signals.length > 0 && (
        <p className="mt-5 border-t border-border pt-3 font-mono text-[11px] leading-5 text-muted-foreground">
          señales:{" "}
          {origin.signals
            .map(
              (signal) =>
                `«${signal.term}»${signal.count > 1 ? ` ×${signal.count}` : ""}`
            )
            .join(" · ")}
        </p>
      )}

      <p className="mt-3 font-mono text-[10px] leading-4 text-muted-foreground">
        {origin.kind === "model"
          ? `Clasificado por el modelo del trabajo de grado (${origin.modelVersion}).`
          : "Demostración con léxico ilustrativo en el navegador; no es el modelo del trabajo de grado."}
      </p>
    </motion.div>
  );
}
