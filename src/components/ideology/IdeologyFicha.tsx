"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";

import {
  fichaNumeral,
  IDEOLOGY_FICHAS,
  oppositeOf,
} from "@/lib/ideology-fichas";
import { IDEOLOGY_META, type IdeologyClass } from "@/types/ideology";

export interface FichaOrigin {
  x: number;
  y: number;
}

interface IdeologyFichaProps {
  /** Clase abierta, o null si la ficha está cerrada. */
  selected: IdeologyClass | null;
  /** Punto del click en coordenadas de viewport (origen del despliegue). */
  origin: FichaOrigin | null;
  onClose: () => void;
  /** Saltar a otra ficha (la clase opuesta) sin cerrar el diálogo. */
  onSwap: (ideologyClass: IdeologyClass) => void;
}

const CARD_HALF_WIDTH = 272;
const CARD_HALF_HEIGHT = 260;

/**
 * Ficha de hemeroteca: modal que se despliega como un recorte de periódico
 * desde el punto exacto del click (transform-origin dinámico) y se repliega
 * al cerrar. Radix Dialog aporta foco atrapado, Escape y cierre por fuera.
 */
export function IdeologyFicha({
  selected,
  origin,
  onClose,
  onSwap,
}: IdeologyFichaProps) {
  const reduce = useReducedMotion();

  const transformOrigin = useMemo(() => {
    if (!origin || typeof window === "undefined") return "50% 50%";
    const x = origin.x - (window.innerWidth / 2 - CARD_HALF_WIDTH);
    const y = origin.y - (window.innerHeight / 2 - CARD_HALF_HEIGHT);
    return `${x}px ${y}px`;
  }, [origin]);

  const meta = selected ? IDEOLOGY_META[selected] : null;
  const ficha = selected ? IDEOLOGY_FICHAS[selected] : null;
  const opposite = selected ? oppositeOf(selected) : null;

  return (
    <DialogPrimitive.Root
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AnimatePresence>
        {selected && meta && ficha && opposite && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-foreground/25"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                transition={{ duration: 0.25 }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
                {/* El recorte se despliega desde el punto del click. */}
                <motion.div
                  className="pointer-events-auto w-full max-w-[34rem]"
                  style={{ transformOrigin }}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.5, rotate: -2, y: 10 }
                  }
                  animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0.15 } }
                      : {
                          opacity: 0,
                          scale: 0.55,
                          rotate: -1.5,
                          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                        }
                  }
                  transition={{ type: "spring", duration: 0.5, bounce: 0.18 }}
                >
                  <div className="rule-double max-h-[85svh] overflow-y-auto bg-card px-6 pb-6 pt-4 shadow-xl ring-1 ring-border sm:px-7">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Ficha de hemeroteca ·{" "}
                        <span className="tabular-nums">
                          {fichaNumeral(selected)}/VIII
                        </span>
                      </p>
                      <DialogPrimitive.Close asChild>
                        <button
                          type="button"
                          aria-label="Cerrar ficha"
                          className="grid size-8 place-items-center text-muted-foreground outline-none transition-colors duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                        >
                          <X className="size-4" />
                        </button>
                      </DialogPrimitive.Close>
                    </div>

                    {/* El cuerpo cambia con animación corta al saltar a la opuesta. */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={selected}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="mt-4 flex items-center gap-2.5">
                          <span
                            aria-hidden
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: meta.cssVar }}
                          />
                          <DialogPrimitive.Title className="font-display text-3xl font-extrabold tracking-tight">
                            {meta.label}
                          </DialogPrimitive.Title>
                        </div>

                        <DialogPrimitive.Description className="mt-3 text-sm font-medium leading-6">
                          {meta.description}
                        </DialogPrimitive.Description>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {ficha.definition}
                        </p>

                        <h3 className="mt-5 text-sm font-semibold">
                          Ejemplos de encuadre
                        </h3>
                        <ul className="mt-2 space-y-1.5">
                          {ficha.examples.map((example) => (
                            <li
                              key={example}
                              className="font-serif text-sm italic leading-6 text-muted-foreground"
                            >
                              {example}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                          Redacciones ilustrativas, no citas reales.
                        </p>

                        {/* Posición en el espectro: eje contra su opuesta. */}
                        <div className="mt-6 border-t border-border pt-4">
                          <div className="flex items-baseline justify-between gap-2 font-mono text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {meta.label}
                            </span>
                            <span>se opone a</span>
                            <button
                              type="button"
                              onClick={() => onSwap(opposite)}
                              className="cursor-pointer text-muted-foreground underline decoration-dotted underline-offset-4 outline-none transition-colors duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                            >
                              {IDEOLOGY_META[opposite].label}
                            </button>
                          </div>
                          <div
                            aria-hidden
                            className="mt-2 flex items-center gap-1.5"
                          >
                            <span
                              className="size-3 shrink-0 rounded-full ring-2 ring-foreground/20"
                              style={{ backgroundColor: meta.cssVar }}
                            />
                            <span className="h-px flex-1 bg-border" />
                            <span
                              className="size-2 shrink-0 rounded-full opacity-50"
                              style={{
                                backgroundColor: IDEOLOGY_META[opposite].cssVar,
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
