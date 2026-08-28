"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  IdeologyFicha,
  type FichaOrigin,
} from "@/components/ideology/IdeologyFicha";
import { SectionOpen } from "@/components/landing/SectionOpen";
import { ROMAN_NUMERALS, ROSE_ORDER } from "@/lib/ideology-fichas";
import { cn } from "@/lib/utils";
import {
  IDEOLOGY_META,
  OPPOSITE_PAIRS,
  type IdeologyClass,
} from "@/types/ideology";

interface FichaState {
  ideologyClass: IdeologyClass;
  origin: FichaOrigin;
}

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

/* Geometría del anillo (viewBox -320..320; el centro es 0,0). */
const R_VERTEX = 252;
const R_DIAGONAL = 200;
const R_ARROW_BASE = 214;
const R_ARROW_TIP = 232;
const ARROW_HALF_WIDTH = 7;

function pointAngle(index: number) {
  return index * 45 - 90;
}

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

/** Punta de flecha apuntando hacia afuera, hacia el vértice `index`. */
function arrowPath(index: number) {
  const angle = pointAngle(index);
  const tip = polar(angle, R_ARROW_TIP);
  const base = polar(angle, R_ARROW_BASE);
  const rad = ((angle + 90) * Math.PI) / 180;
  const px = Math.cos(rad) * ARROW_HALF_WIDTH;
  const py = Math.sin(rad) * ARROW_HALF_WIDTH;
  return `M ${tip.x} ${tip.y} L ${base.x + px} ${base.y + py} L ${base.x - px} ${base.y - py} Z`;
}

const OCTAGON_POINTS = Array.from({ length: 8 }, (_, index) => {
  const { x, y } = polar(pointAngle(index), R_VERTEX);
  return `${x},${y}`;
}).join(" ");

/**
 * Las ocho clases como anillo octogonal: cada clase en un vértice, cada
 * una apuntando a su contraria con diagonales de doble flecha (las puntas
 * siempre en el color de su clase). Hover/foco enciende el eje del par y
 * muestra la descripción en la leyenda fija; el click abre la ficha de
 * hemeroteca desde ese punto. En móvil colapsa a la lista de los 4 pares.
 */
export function TensionAxes() {
  const reduce = useReducedMotion();
  const [ficha, setFicha] = useState<FichaState | null>(null);
  const [active, setActive] = useState<IdeologyClass | null>(null);

  const openFicha = (ideologyClass: IdeologyClass, event: React.MouseEvent) =>
    setFicha({
      ideologyClass,
      origin: { x: event.clientX, y: event.clientY },
    });

  const activePair = active
    ? OPPOSITE_PAIRS.find((pair) => pair.includes(active))
    : null;

  return (
    <section
      id="clases"
      aria-label="Las ocho clases ideológicas"
      className="mx-auto w-full max-w-7xl scroll-mt-header px-4 py-24 sm:px-6 md:py-32"
    >
      <SectionOpen
        title="Ocho clases, cuatro tensiones"
        lede="Cada eje conecta dos encuadres opuestos. Pulse una clase para abrir su ficha; ninguna medición juzga la veracidad de los hechos."
      />

      {/* Anillo octogonal (desde sm; en móvil, lista de pares). */}
      <motion.div
        className="relative mx-auto mt-14 hidden aspect-square w-full max-w-[620px] sm:block md:mt-16"
        initial={reduce ? undefined : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
      >
        <svg
          aria-hidden
          viewBox="-320 -320 640 640"
          className="size-full overflow-visible"
        >
          {/* Contorno del anillo. */}
          <motion.polygon
            points={OCTAGON_POINTS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1.5}
            variants={
              reduce
                ? undefined
                : {
                    hidden: { pathLength: 0, opacity: 0 },
                    show: {
                      pathLength: 1,
                      opacity: 1,
                      transition: { duration: 1, ease: EASE_EXPO },
                    },
                  }
            }
          />

          {/* Diagonales: cada clase hacia su contraria. */}
          {[0, 1, 2, 3].map((axis) => {
            const a = polar(pointAngle(axis), R_DIAGONAL);
            const b = polar(pointAngle(axis + 4), R_DIAGONAL);
            const [left, right] = OPPOSITE_PAIRS[axis];
            const focused = active === left || active === right;
            return (
              <motion.line
                key={axis}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={focused ? "var(--foreground)" : "var(--border)"}
                strokeWidth={focused ? 1.8 : 1}
                className="transition-[stroke,stroke-width] duration-200 ease-out-expo"
                variants={
                  reduce
                    ? undefined
                    : {
                        hidden: { pathLength: 0, opacity: 0 },
                        show: {
                          pathLength: 1,
                          opacity: 1,
                          transition: {
                            duration: 0.7,
                            delay: 0.35 + axis * 0.1,
                            ease: EASE_EXPO,
                          },
                        },
                      }
                }
              />
            );
          })}

          {/* Puntas de flecha, siempre en el color de su clase. */}
          {ROSE_ORDER.map((ideologyClass, index) => {
            const pairFocused =
              active !== null &&
              OPPOSITE_PAIRS.some(
                (pair) =>
                  pair.includes(ideologyClass) && pair.includes(active)
              );
            return (
              <motion.path
                key={ideologyClass}
                d={arrowPath(index)}
                fill={IDEOLOGY_META[ideologyClass].cssVar}
                className="transition-opacity duration-200 ease-out-expo"
                opacity={active === null || pairFocused ? 1 : 0.3}
                variants={
                  reduce
                    ? undefined
                    : {
                        hidden: { scale: 0, opacity: 0 },
                        show: {
                          scale: 1,
                          opacity: 1,
                          transition: {
                            delay: 0.9 + index * 0.05,
                            type: "spring",
                            duration: 0.5,
                            bounce: 0.3,
                          },
                        },
                      }
                }
              />
            );
          })}
        </svg>

        {/* Vértices: botones reales sobre el SVG. */}
        {ROSE_ORDER.map((ideologyClass, index) => {
          const meta = IDEOLOGY_META[ideologyClass];
          const { x, y } = polar(pointAngle(index), R_VERTEX);
          const left = 50 + (x / 640) * 100;
          const top = 50 + (y / 640) * 100;
          const orientation =
            index === 0
              ? "flex-col-reverse gap-1"
              : index === 4
                ? "flex-col gap-1"
                : index >= 5
                  ? "flex-row-reverse"
                  : "";
          const isActive = active === ideologyClass;
          const isOpposite =
            (activePair?.includes(ideologyClass) ?? false) && !isActive;

          return (
            <motion.button
              key={ideologyClass}
              type="button"
              onClick={(event) => openFicha(ideologyClass, event)}
              onMouseEnter={() => setActive(ideologyClass)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(ideologyClass)}
              onBlur={() => setActive(null)}
              aria-label={`${meta.label}: abrir ficha`}
              className={cn(
                "group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-1.5 bg-background px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                orientation
              )}
              style={{ left: `${left}%`, top: `${top}%` }}
              variants={
                reduce
                  ? undefined
                  : {
                      hidden: { opacity: 0, scale: 1.5 },
                      show: {
                        opacity: 1,
                        scale: 1,
                        transition: {
                          delay: 0.55 + index * 0.06,
                          type: "spring",
                          duration: 0.5,
                          bounce: 0.3,
                        },
                      },
                    }
              }
            >
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full ring-2 ring-background transition-transform duration-150 ease-out-expo group-hover:scale-125 group-focus-visible:scale-125"
                style={{ backgroundColor: meta.cssVar }}
              />
              <span
                className={cn(
                  "whitespace-nowrap font-mono text-[11px] uppercase tracking-wide transition-colors duration-150 ease-out-expo md:text-xs",
                  isActive
                    ? "font-bold text-foreground"
                    : isOpposite
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                <span className="mr-1 tabular-nums opacity-60">
                  {ROMAN_NUMERALS[index]}
                </span>
                {meta.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Leyenda fija: la descripción de la clase activa. */}
      <p
        aria-live="polite"
        className="mx-auto mt-6 hidden min-h-12 max-w-xl text-center text-sm leading-6 text-pretty text-muted-foreground sm:block"
      >
        {active ? (
          <>
            <span className="font-semibold text-foreground">
              {IDEOLOGY_META[active].label}:
            </span>{" "}
            {IDEOLOGY_META[active].description}
          </>
        ) : (
          "Cada clase se opone a la del vértice contrario."
        )}
      </p>

      {/* Móvil: los 4 pares como lista accionable. */}
      <div className="mt-12 space-y-8 sm:hidden">
        {OPPOSITE_PAIRS.map(([left, right]) => {
          const leftMeta = IDEOLOGY_META[left];
          const rightMeta = IDEOLOGY_META[right];
          return (
            <div key={left} className="space-y-2">
              <div className="flex items-center gap-2">
                <PairButton ideologyClass={left} onOpen={openFicha} />
                <span
                  aria-hidden
                  className="flex flex-1 items-center gap-1.5"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: leftMeta.cssVar }}
                  />
                  <span className="h-px min-w-4 flex-1 bg-border" />
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: rightMeta.cssVar }}
                  />
                </span>
                <PairButton ideologyClass={right} onOpen={openFicha} />
              </div>
            </div>
          );
        })}
        <p className="text-xs leading-5 text-muted-foreground">
          Pulse una clase para abrir su ficha con definición y ejemplos.
        </p>
      </div>

      <IdeologyFicha
        selected={ficha?.ideologyClass ?? null}
        origin={ficha?.origin ?? null}
        onClose={() => setFicha(null)}
        onSwap={(ideologyClass) =>
          setFicha((state) => (state ? { ...state, ideologyClass } : null))
        }
      />
    </section>
  );
}

function PairButton({
  ideologyClass,
  onOpen,
}: {
  ideologyClass: IdeologyClass;
  onOpen: (ideologyClass: IdeologyClass, event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(ideologyClass, event)}
      className="cursor-pointer font-display text-lg font-bold tracking-tight outline-none transition-colors duration-150 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {IDEOLOGY_META[ideologyClass].label}
    </button>
  );
}
