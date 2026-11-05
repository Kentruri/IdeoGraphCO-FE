"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";

import { IdeologyRadial } from "@/components/ideology/IdeologyRadial";
import { formatProbability } from "@/lib/format";
import {
  AXIS_COUNT,
  HEATMAP_AXES,
  LEGEND_TICKS,
  RANK_ORDINALS,
} from "@/lib/heatmap";
import { oppositeOf } from "@/lib/ideology-fichas";
import { cn } from "@/lib/utils";
import {
  IDEOLOGY_META,
  type IdeologyClass,
  type IdeologyDistribution,
} from "@/types/ideology";

/** El relieve 3D (three.js) solo se descarga donde se usa, y nunca en SSR. */
const IdeologyTerrain = dynamic(
  () => import("@/components/ideology/IdeologyTerrain"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] w-full animate-pulse bg-muted/50 @xl:aspect-[16/10]" />
    ),
  }
);

interface IdeologyHeatmapProps {
  /** Distribución de 8 clases de la noticia (suma 1). */
  probabilities: IdeologyDistribution;
  /** Clase que se encara al inicio (la predicha). */
  focus: IdeologyClass;
  /** Nombre accesible del grupo de ejes. */
  label: string;
  /** Muestra la descripción de la clase en la lectura. */
  showDescription?: boolean;
  /** Superficie sobre la que se dibuja (fondo de las cifras flotantes). */
  surface?: "card" | "background";
  className?: string;
}

/**
 * Mapa de calor 3D de la distribución ideológica de una noticia: una colina
 * por clase, enfrentada a su opuesta, cuya altura y color crecen con la
 * probabilidad. Se recorre girando la cámara; fijar una clase (clic,
 * flechas) la lleva al frente y la lectura de abajo la explica. Sin WebGL
 * cae a la vista cenital 2D, con la misma interacción.
 */
export function IdeologyHeatmap({
  probabilities,
  focus,
  label,
  showDescription = true,
  surface = "card",
  className,
}: IdeologyHeatmapProps) {
  const focusIndex = HEATMAP_AXES.indexOf(focus);
  const [pinned, setPinned] = useState(focusIndex);
  const [preview, setPreview] = useState<number | null>(null);
  const [flat, setFlat] = useState(false);
  const active = preview ?? pinned;
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Otra noticia (u otro veredicto): la lectura vuelve a la clase predicha.
  useEffect(() => {
    setPinned(focusIndex);
  }, [focusIndex]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: AXIS_COUNT - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const wrapped = (next + AXIS_COUNT) % AXIS_COUNT;
    setPinned(wrapped);
    buttonRefs.current[wrapped]?.focus({ preventScroll: true });
  };

  const renderLabel = (index: number) => {
    const ideologyClass = HEATMAP_AXES[index];
    const meta = IDEOLOGY_META[ideologyClass];
    const probability = probabilities[ideologyClass];
    const isActive = index === active;
    return (
      <button
        ref={(node) => {
          buttonRefs.current[index] = node;
        }}
        type="button"
        role="radio"
        aria-checked={index === pinned}
        aria-label={`${meta.label}, ${formatProbability(probability)}`}
        tabIndex={index === pinned ? 0 : -1}
        onClick={() => setPinned(index)}
        onKeyDown={(event) => onKeyDown(event, index)}
        onPointerEnter={() => setPreview(index)}
        onPointerLeave={() => setPreview(null)}
        className={cn(
          "flex cursor-pointer flex-col items-center whitespace-nowrap rounded-sm px-1 text-center outline-none transition-[color,scale] duration-150 ease-out-expo [text-shadow:0_0_3px_var(--heatmap-surface),0_0_3px_var(--heatmap-surface),0_0_6px_var(--heatmap-surface)] focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.97]",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "text-[11px] leading-4 @md:text-xs",
            isActive ? "font-semibold" : "font-medium"
          )}
        >
          {meta.label}
        </span>
        <span className="font-mono text-[11px] leading-4 tabular-nums">
          {formatProbability(probability)}
        </span>
      </button>
    );
  };

  const activeClass = HEATMAP_AXES[active];
  const activeMeta = IDEOLOGY_META[activeClass];
  const activeProbability = probabilities[activeClass];
  const opposite = oppositeOf(activeClass);
  const pairTotal = activeProbability + probabilities[opposite];
  const pairShare =
    pairTotal > 0 ? Math.round((activeProbability / pairTotal) * 100) : 50;
  const rank = [...HEATMAP_AXES]
    .sort((a, b) => probabilities[b] - probabilities[a])
    .indexOf(activeClass);

  return (
    <figure
      className={cn(
        "@container",
        surface === "card"
          ? "[--heatmap-surface:var(--color-card)]"
          : "[--heatmap-surface:var(--color-background)]",
        className
      )}
    >
      <div role="radiogroup" aria-label={label}>
        {flat ? (
          <IdeologyRadial
            probabilities={probabilities}
            active={active}
            onPreview={setPreview}
            onChoose={setPinned}
            renderLabel={renderLabel}
          />
        ) : (
          <IdeologyTerrain
            probabilities={probabilities}
            active={active}
            focus={pinned}
            onPreview={setPreview}
            onChoose={setPinned}
            renderLabel={renderLabel}
            onUnsupported={() => setFlat(true)}
          />
        )}
      </div>

      <div className="mt-5 grid gap-6 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] @2xl:gap-10">
        {/* Lectura de la clase activa. */}
        <div aria-live="off" className="min-h-[6.5rem] border-t border-border pt-4">
          <div className="flex items-baseline gap-2.5">
            <span
              aria-hidden
              className="size-2.5 shrink-0 translate-y-[-1px] rounded-full"
              style={{ backgroundColor: activeMeta.cssVar }}
            />
            <p className="font-display text-xl font-bold tracking-tight">
              {activeMeta.label}
            </p>
            <p className="ml-auto font-mono text-xl font-semibold tabular-nums">
              {formatProbability(activeProbability)}
            </p>
          </div>
          <p className="mt-1 font-mono text-[11px] leading-5 text-muted-foreground">
            <span className="tabular-nums text-foreground">
              {RANK_ORDINALS[rank]}
            </span>{" "}
            de 8 · frente a {IDEOLOGY_META[opposite].label}:{" "}
            <span className="tabular-nums text-foreground">{pairShare} %</span>{" "}
            del par
          </p>
          {showDescription && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {activeMeta.description}
            </p>
          )}
        </div>

        <HeatLegend flat={flat} />
      </div>
    </figure>
  );
}

/** Escala de calor: mismas paradas (y la misma raíz) que el relieve. */
function HeatLegend({ flat }: { flat: boolean }) {
  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium">Escala de calor</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          probabilidad de la clase
        </p>
      </div>
      <div aria-hidden className="heat-ramp mt-2 h-1.5 rounded-full" />
      <div
        aria-hidden
        className="relative mt-1.5 h-3 font-mono text-[10px] leading-none tabular-nums text-muted-foreground"
      >
        {LEGEND_TICKS.map(([probability, text], index) => (
          <span
            key={probability}
            className={cn(
              "absolute top-0 whitespace-nowrap",
              index === 0
                ? ""
                : index === LEGEND_TICKS.length - 1
                  ? "-translate-x-full"
                  : "-translate-x-1/2"
            )}
            style={{ left: `${Math.sqrt(probability) * 100}%` }}
          >
            {text}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        {flat
          ? "El radio crece con la raíz cuadrada de la probabilidad, así las clases pequeñas siguen a la vista. El anillo discontinuo marca el reparto uniforme (12,5 %)."
          : "La altura crece con la raíz cuadrada de la probabilidad, así las clases pequeñas siguen a la vista. Las curvas de nivel marcan 5, 12,5 (reparto uniforme), 25 y 50 %."}
      </p>
    </div>
  );
}
