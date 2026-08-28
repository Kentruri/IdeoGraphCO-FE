import { cn } from "@/lib/utils";
import { formatProbability } from "@/lib/format";
import {
  IDEOLOGY_DISPLAY_ORDER,
  IDEOLOGY_META,
  type IdeologyDistribution,
} from "@/types/ideology";

interface IdeologyStripProps {
  probabilities: IdeologyDistribution;
  className?: string;
}

/**
 * Franja apilada con la distribución de probabilidad de las 8 clases.
 * Los segmentos siguen IDEOLOGY_DISPLAY_ORDER (orden validado para
 * daltonismo) y van separados por un espacio de 2px de superficie.
 */
export function IdeologyStrip({ probabilities, className }: IdeologyStripProps) {
  const summary = IDEOLOGY_DISPLAY_ORDER.map(
    (ideologyClass) =>
      `${IDEOLOGY_META[ideologyClass].label}: ${formatProbability(
        probabilities[ideologyClass]
      )}`
  ).join(" · ");

  return (
    <div
      role="img"
      aria-label={`Distribución ideológica: ${summary}`}
      className={cn("flex h-1.5 w-full gap-0.5", className)}
    >
      {IDEOLOGY_DISPLAY_ORDER.map((ideologyClass) => (
        <span
          key={ideologyClass}
          className="h-full rounded-full"
          style={{
            width: `${probabilities[ideologyClass] * 100}%`,
            backgroundColor: IDEOLOGY_META[ideologyClass].cssVar,
          }}
        />
      ))}
    </div>
  );
}
