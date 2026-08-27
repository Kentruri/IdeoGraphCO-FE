import { formatProbability } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  IDEOLOGY_CLASSES,
  IDEOLOGY_META,
  type IdeologyClass,
  type IdeologyDistribution as Distribution,
} from "@/types/ideology";

interface IdeologyDistributionProps {
  probabilities: Distribution;
  /** Clase predicha (se resalta en la lista). */
  predicted: IdeologyClass;
  className?: string;
}

/**
 * Lista de barras con la distribución softmax completa, ordenada de mayor
 * a menor probabilidad. Cada fila lleva etiqueta y valor visibles, de modo
 * que la lectura nunca depende únicamente del color. Las barras animan
 * `transform: scaleX` (no `width`) y solo bajo `motion-safe`.
 */
export function IdeologyDistribution({
  probabilities,
  predicted,
  className,
}: IdeologyDistributionProps) {
  const rows = [...IDEOLOGY_CLASSES].sort(
    (a, b) => probabilities[b] - probabilities[a]
  );
  const maxProbability = probabilities[rows[0]];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {rows.map((ideologyClass) => {
        const meta = IDEOLOGY_META[ideologyClass];
        const probability = probabilities[ideologyClass];
        const isPredicted = ideologyClass === predicted;

        return (
          <div
            key={ideologyClass}
            className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3"
          >
            <span
              className={cn(
                "flex items-center gap-1.5 truncate text-sm",
                isPredicted
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: meta.cssVar }}
              />
              {meta.label}
            </span>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-swift"
                style={{
                  // Escala relativa al máximo para que la barra líder ocupe
                  // todo el riel y las demás se lean en proporción.
                  transform: `scaleX(${probability / maxProbability})`,
                  backgroundColor: meta.cssVar,
                }}
              />
            </div>
            <span
              className={cn(
                "w-14 text-right font-mono text-xs tabular-nums",
                isPredicted
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {formatProbability(probability)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
