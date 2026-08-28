"use client";

import { useEffect, useRef, useState } from "react";
import { Stamp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { IdeologyDistribution } from "@/components/ideology/IdeologyDistribution";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { SectionOpen } from "@/components/landing/SectionOpen";
import { CountUp } from "@/components/motion/CountUp";
import { Button } from "@/components/ui/button";
import { classifyDemoText, type DemoVerdict } from "@/lib/demo-classifier";
import { formatConfidence } from "@/lib/format";
import { IDEOLOGY_META } from "@/types/ideology";

const MIN_LENGTH = 40;
const MAX_LENGTH = 4000;

type DeskState =
  | { phase: "idle" }
  | { phase: "composing" }
  | { phase: "verdict"; verdict: DemoVerdict };

/**
 * Mesa de redacción: el corazón del producto en la portada. El usuario
 * pega un texto político y recibe el veredicto editorial (clase predicha,
 * confianza y distribución). Corre con el léxico de demostración en el
 * navegador y lo declara junto al resultado.
 */
export function ClassifierDesk({ standalone = false }: { standalone?: boolean }) {
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [state, setState] = useState<DeskState>({ phase: "idle" });
  const composingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (composingTimer.current) clearTimeout(composingTimer.current);
    },
    []
  );

  const tooShort = text.trim().length > 0 && text.trim().length < MIN_LENGTH;
  const canSubmit = text.trim().length >= MIN_LENGTH;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const verdict = classifyDemoText(text);
    if (composingTimer.current) clearTimeout(composingTimer.current);
    if (reduce) {
      setState({ phase: "verdict", verdict });
      return;
    }
    // Compás de imprenta: el veredicto "se compone" antes de estamparse.
    setState({ phase: "composing" });
    composingTimer.current = setTimeout(
      () => setState({ phase: "verdict", verdict }),
      520
    );
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
        lede="Pegue un texto político —una noticia, un discurso, una columna— y el clasificador repartirá su encuadre entre las ocho clases."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-8">
        {/* La cuartilla */}
        <form onSubmit={handleSubmit} className="flex flex-col">
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
  verdict: DemoVerdict;
  reduce: boolean;
}) {
  const meta = IDEOLOGY_META[verdict.predicted];

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
          <CountUp value={verdict.confidence} format={formatConfidence} />
        </p>
        <p className="text-sm text-muted-foreground">
          {verdict.hasSignals
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

      {verdict.signals.length > 0 && (
        <p className="mt-5 border-t border-border pt-3 font-mono text-[11px] leading-5 text-muted-foreground">
          señales:{" "}
          {verdict.signals
            .map(
              (signal) =>
                `«${signal.term}»${signal.count > 1 ? ` ×${signal.count}` : ""}`
            )
            .join(" · ")}
        </p>
      )}

      <p className="mt-3 font-mono text-[10px] leading-4 text-muted-foreground">
        Demostración con léxico ilustrativo en el navegador; no es el modelo
        del trabajo de grado.
      </p>
    </motion.div>
  );
}
