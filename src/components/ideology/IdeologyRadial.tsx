"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import {
  AXIS_COUNT,
  AXIS_STEP,
  EASE_OUT,
  HEAT_STOPS,
  HEATMAP_AXES,
  heatLevel,
  ISO_LEVELS,
} from "@/lib/heatmap";
import { cn } from "@/lib/utils";
import type { IdeologyDistribution } from "@/types/ideology";

interface RadialProps {
  probabilities: IdeologyDistribution;
  active: number;
  onPreview: (index: number | null) => void;
  onChoose: (index: number) => void;
  renderLabel: (index: number) => ReactNode;
}

/** Radio del anillo exterior (100 %) en unidades del viewBox. */
const R = 100;
const VIEW = 106;
const SAMPLES = 18;
const FLOOR = 1.5;
const UNIFORM = 1 / AXIS_COUNT;
const RINGS = [...ISO_LEVELS, 1];
const RING_TICKS: ReadonlyArray<readonly [number, string]> = [
  [0.125, "12,5"],
  [0.25, "25"],
  [0.5, "50"],
  [1, "100 %"],
];

function radiusOf(probability: number) {
  return FLOOR + (R - FLOOR) * heatLevel(probability);
}

function point(radius: number, angle: number): [number, number] {
  return [radius * Math.sin(angle), -radius * Math.cos(angle)];
}

function fmt(value: number) {
  return value.toFixed(2);
}

/** Contorno: interpolación coseno entre ejes (valor exacto en cada eje). */
function blobPath(radii: readonly number[]) {
  let d = "";
  for (let i = 0; i < AXIS_COUNT; i++) {
    const r0 = radii[i];
    const r1 = radii[(i + 1) % AXIS_COUNT];
    for (let s = 0; s < SAMPLES; s++) {
      const u = s / SAMPLES;
      const r = r0 + ((r1 - r0) * (1 - Math.cos(Math.PI * u))) / 2;
      const [x, y] = point(r, (i + u) * AXIS_STEP);
      d += `${i === 0 && s === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`;
    }
  }
  return `${d}Z`;
}

function dotsPath(radii: readonly number[], size: number) {
  let d = "";
  radii.forEach((radius, i) => {
    const [x, y] = point(radius, i * AXIS_STEP);
    d += `M${fmt(x - size)} ${fmt(y)}a${size} ${size} 0 1 0 ${size * 2} 0a${size} ${size} 0 1 0 ${-size * 2} 0`;
  });
  return d;
}

function wedgePath(index: number) {
  const [x0, y0] = point(VIEW, (index - 0.5) * AXIS_STEP);
  const [x1, y1] = point(VIEW, (index + 0.5) * AXIS_STEP);
  return `M0 0L${fmt(x0)} ${fmt(y0)}A${VIEW} ${VIEW} 0 0 1 ${fmt(x1)} ${fmt(y1)}Z`;
}

function boxPercent(x: number, y: number) {
  return { left: `${50 + (x / VIEW) * 50}%`, top: `${50 + (y / VIEW) * 50}%` };
}

/** Hacia dónde crece cada etiqueta desde la punta de su eje (N, NE, E…). */
const LABEL_PLACEMENT = [
  "-translate-x-1/2 -translate-y-full pb-1.5",
  "-translate-y-full pb-0.5 pl-1",
  "-translate-y-1/2 pl-2.5",
  "pl-1 pt-0.5",
  "-translate-x-1/2 pt-1.5",
  "-translate-x-full pr-1 pt-0.5",
  "-translate-x-full -translate-y-1/2 pr-2.5",
  "-translate-x-full -translate-y-full pb-0.5 pr-1",
];

/**
 * Respaldo 2D del mapa de calor (sin WebGL): vista cenital del mismo
 * relieve. El radio de cada lóbulo y su color siguen el nivel de calor.
 */
export function IdeologyRadial({
  probabilities,
  active,
  onPreview,
  onChoose,
  renderLabel,
}: RadialProps) {
  const reduce = useReducedMotion() ?? false;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `heat-${uid}`;
  const clipId = `heat-clip-${uid}`;

  const target = HEATMAP_AXES.map((c) => radiusOf(probabilities[c]));
  const signature = target.map((r) => r.toFixed(3)).join(" ");

  const fromRef = useRef<number[]>(HEATMAP_AXES.map(() => radiusOf(UNIFORM)));
  const toRef = useRef<number[]>(target);
  const progress = useMotionValue(reduce ? 1 : 0);
  const radiiAt = (t: number) =>
    fromRef.current.map((r0, i) => r0 + (toRef.current[i] - r0) * t);

  useEffect(() => {
    fromRef.current = radiiAt(progress.get());
    toRef.current = signature.split(" ").map(Number);
    progress.jump(0);
    if (reduce) {
      progress.jump(1);
      return;
    }
    const controls = animate(progress, 1, { duration: 0.6, ease: EASE_OUT });
    return () => controls.stop();
    // radiiAt solo lee refs; la firma resume el contenido de `target`.
  }, [signature, reduce, progress]);

  const blobD = useTransform(progress, (t) => blobPath(radiiAt(t)));
  const dotsD = useTransform(progress, (t) => dotsPath(radiiAt(t), 1.9));
  const activeRadius = useTransform(progress, (t) => radiiAt(t)[active]);
  const activeX = useTransform(progress, (t) => point(radiiAt(t)[active], active * AXIS_STEP)[0]);
  const activeY = useTransform(progress, (t) => point(radiiAt(t)[active], active * AXIS_STEP)[1]);

  const svgRef = useRef<SVGSVGElement>(null);
  const indexFromPointer = (event: MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 * VIEW - VIEW;
    const y = ((event.clientY - rect.top) / rect.height) * 2 * VIEW - VIEW;
    if (Math.hypot(x, y) > VIEW) return null;
    const angle = Math.atan2(x, -y);
    return ((Math.round(angle / AXIS_STEP) % AXIS_COUNT) + AXIS_COUNT) % AXIS_COUNT;
  };

  return (
    <div className="mx-auto w-full max-w-[30rem] px-20 py-9 @md:px-[5.5rem] @md:py-10">
      <div className="relative aspect-square w-full">
        <svg
          ref={svgRef}
          viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
          aria-hidden
          className="absolute inset-0 size-full cursor-crosshair overflow-visible"
          onMouseMove={(event) => onPreview(indexFromPointer(event))}
          onMouseLeave={() => onPreview(null)}
          onClick={(event) => {
            const index = indexFromPointer(event);
            if (index !== null) onChoose(index);
          }}
        >
          <defs>
            <radialGradient id={gradientId} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
              {HEAT_STOPS.map(([offset, variable]) => (
                <stop key={offset} offset={offset} style={{ stopColor: `var(${variable})` }} />
              ))}
            </radialGradient>
            <clipPath id={clipId}>
              <motion.path d={blobD} />
            </clipPath>
          </defs>

          <path d={wedgePath(active)} className="fill-foreground/[0.045]" />
          {RINGS.map((ring) => (
            <circle
              key={ring}
              r={radiusOf(ring)}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={ring === UNIFORM ? "3 3" : undefined}
              className={cn(
                ring === UNIFORM
                  ? "stroke-muted-foreground/60"
                  : ring === 1
                    ? "stroke-foreground/30"
                    : "stroke-border"
              )}
            />
          ))}
          {HEATMAP_AXES.map((ideologyClass, index) => {
            const [x, y] = point(R, index * AXIS_STEP);
            return (
              <line
                key={ideologyClass}
                x1="0"
                y1="0"
                x2={fmt(x)}
                y2={fmt(y)}
                vectorEffect="non-scaling-stroke"
                className="stroke-border"
              />
            );
          })}

          <motion.path d={blobD} fill={`url(#${gradientId})`} className="opacity-95" />
          <g clipPath={`url(#${clipId})`}>
            {ISO_LEVELS.map((ring) => (
              <circle
                key={ring}
                r={radiusOf(ring)}
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeDasharray={ring === UNIFORM ? "3 3" : undefined}
                className="stroke-[var(--heat-iso)]"
              />
            ))}
          </g>
          <motion.path
            d={blobD}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            className="stroke-foreground/70"
          />

          <line
            x1="0"
            y1="0"
            x2={fmt(point(R, active * AXIS_STEP)[0])}
            y2={fmt(point(R, active * AXIS_STEP)[1])}
            vectorEffect="non-scaling-stroke"
            className="stroke-foreground/60"
          />
          <motion.circle
            r={activeRadius}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="1 3"
            strokeLinecap="round"
            className="stroke-foreground/55"
          />
          <motion.path d={dotsD} className="fill-foreground" />
          <motion.circle
            cx={activeX}
            cy={activeY}
            r={4.2}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className="fill-foreground stroke-[var(--heatmap-surface)]"
          />
          <circle r={1.6} className="fill-foreground/70" />
        </svg>

        {RING_TICKS.map(([ring, text]) => {
          const [x, y] = point(radiusOf(ring) + 2, AXIS_STEP / 2);
          return (
            <span
              key={ring}
              aria-hidden
              style={boxPercent(x, y)}
              className="pointer-events-none absolute -translate-y-full font-mono text-[9px] leading-none tabular-nums text-muted-foreground [text-shadow:0_0_2px_var(--heatmap-surface),0_0_2px_var(--heatmap-surface),0_0_3px_var(--heatmap-surface)]"
            >
              {text}
            </span>
          );
        })}

        {HEATMAP_AXES.map((ideologyClass, index) => {
          const [x, y] = point(R + 3, index * AXIS_STEP);
          return (
            <div
              key={ideologyClass}
              style={boxPercent(x, y)}
              className={cn("absolute", LABEL_PLACEMENT[index])}
            >
              {renderLabel(index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
