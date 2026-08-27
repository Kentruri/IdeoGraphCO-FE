import { cva, type VariantProps } from "class-variance-authority";

import { formatConfidence } from "@/lib/format";
import { cn } from "@/lib/utils";
import { IDEOLOGY_META, type IdeologyClass } from "@/types/ideology";

const ideologyBadgeVariants = cva(
  "inline-flex items-center rounded-full border bg-background font-medium text-foreground",
  {
    variants: {
      size: {
        sm: "gap-1.5 px-2 py-0.5 text-xs",
        md: "gap-2 px-3 py-1 text-sm",
      },
    },
    defaultVariants: { size: "sm" },
  }
);

const ideologyDotVariants = cva("shrink-0 rounded-full", {
  variants: {
    size: {
      sm: "size-2",
      md: "size-2.5",
    },
  },
  defaultVariants: { size: "sm" },
});

interface IdeologyBadgeProps extends VariantProps<typeof ideologyBadgeVariants> {
  ideologyClass: IdeologyClass;
  /** Probabilidad de la clase predicha, en [0, 1]. */
  confidence?: number;
  className?: string;
}

/**
 * Identifica una clase ideológica con su color + etiqueta de texto.
 * El texto siempre acompaña al color: la identidad nunca depende
 * solo del tono (requisito de accesibilidad de la paleta).
 * La descripción de la clase se ofrece en texto visible (detalle) o en
 * tooltips accesibles (leyenda de portada), nunca via `title`.
 */
export function IdeologyBadge({
  ideologyClass,
  confidence,
  size,
  className,
}: IdeologyBadgeProps) {
  const meta = IDEOLOGY_META[ideologyClass];

  return (
    <span className={cn(ideologyBadgeVariants({ size }), className)}>
      <span
        aria-hidden
        className={ideologyDotVariants({ size })}
        style={{ backgroundColor: meta.cssVar }}
      />
      {meta.label}
      {confidence !== undefined && (
        <span className="font-mono text-[0.9em] tabular-nums text-muted-foreground">
          {formatConfidence(confidence)}
        </span>
      )}
    </span>
  );
}
