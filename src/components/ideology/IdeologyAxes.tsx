import {
  IDEOLOGY_META,
  OPPOSITE_PAIRS,
  type IdeologyDistribution,
} from "@/types/ideology";

interface IdeologyAxesProps {
  probabilities: IdeologyDistribution;
}

/**
 * Los 4 pares opuestos como medidores de tensión: el marcador se desplaza
 * hacia el polo con mayor peso relativo dentro del par. Cada eje lleva
 * etiquetas y porcentajes visibles (el color nunca identifica solo).
 */
export function IdeologyAxes({ probabilities }: IdeologyAxesProps) {
  return (
    <div className="flex flex-col gap-5">
      {OPPOSITE_PAIRS.map(([left, right]) => {
        const leftMeta = IDEOLOGY_META[left];
        const rightMeta = IDEOLOGY_META[right];
        const total = probabilities[left] + probabilities[right];
        const leftShare = total > 0 ? probabilities[left] / total : 0.5;
        const leftPercent = Math.round(leftShare * 100);
        const rightPercent = 100 - leftPercent;

        return (
          <div
            key={left}
            role="img"
            aria-label={`${leftMeta.label} ${leftPercent} % frente a ${rightMeta.label} ${rightPercent} %`}
            className="space-y-1.5"
          >
            <div className="flex items-baseline justify-between gap-2 font-mono text-[11px] leading-4 text-muted-foreground">
              <span className="truncate">
                {leftMeta.label}{" "}
                <span className="tabular-nums text-foreground">
                  {leftPercent} %
                </span>
              </span>
              <span className="truncate text-right">
                <span className="tabular-nums text-foreground">
                  {rightPercent} %
                </span>{" "}
                {rightMeta.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: leftMeta.cssVar }}
              />
              <div className="relative h-px flex-1 bg-border">
                <span
                  aria-hidden
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground"
                  style={{ left: `${(1 - leftShare) * 100}%` }}
                />
              </div>
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: rightMeta.cssVar }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
