import { cn } from "@/lib/utils";
import { formatConfidence } from "@/lib/format";
import { IDEOLOGY_META, type IdeologyClass } from "@/types/ideology";

interface IdeologyBadgeProps {
  ideologyClass: IdeologyClass;
  /** Probabilidad de la clase predicha, en [0, 1]. */
  confidence?: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Identifica una clase ideológica con su color + etiqueta de texto.
 * El texto siempre acompaña al color: la identidad nunca depende
 * solo del tono (requisito de accesibilidad de la paleta).
 */
export function IdeologyBadge({
  ideologyClass,
  confidence,
  size = "sm",
  className,
}: IdeologyBadgeProps) {
  const meta = IDEOLOGY_META[ideologyClass];

  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background font-medium text-foreground",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "shrink-0 rounded-full",
          size === "sm" ? "size-2" : "size-2.5"
        )}
        style={{ backgroundColor: meta.cssVar }}
      />
      {meta.label}
      {confidence !== undefined && (
        <span className="tabular-nums text-muted-foreground">
          {formatConfidence(confidence)}
        </span>
      )}
    </span>
  );
}
