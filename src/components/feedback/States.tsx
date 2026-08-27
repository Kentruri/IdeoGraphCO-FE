import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IDEOLOGY_DISPLAY_ORDER, IDEOLOGY_META } from "@/types/ideology";

/**
 * Motivo de los estados de feedback: la fila de 8 puntos del sistema.
 * En vacío, apagada y alineada; en error, desalineada (la medición se rompió).
 */
function DotsMotif({ broken = false }: { broken?: boolean }) {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {IDEOLOGY_DISPLAY_ORDER.map((ideologyClass, index) => (
        <span
          key={ideologyClass}
          className={cn(
            "size-2 rounded-full",
            broken
              ? "opacity-70"
              : "opacity-35 motion-safe:transition-opacity motion-safe:duration-300"
          )}
          style={{
            backgroundColor: IDEOLOGY_META[ideologyClass].cssVar,
            transform: broken
              ? `translateY(${index % 2 === 0 ? -4 : 4}px)`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 border border-dashed border-destructive/40 px-6 py-20 text-center",
        className
      )}
    >
      <DotsMotif broken />
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">
        No pudimos cargar las noticias
      </p>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Ocurrió un error al consultar la API. Verifica tu conexión e inténtalo
        de nuevo.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-3 gap-2">
          <RotateCcw aria-hidden className="size-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 border border-dashed px-6 py-20 text-center",
        className
      )}
    >
      <DotsMotif />
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">
        {title}
      </p>
      {description && (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
