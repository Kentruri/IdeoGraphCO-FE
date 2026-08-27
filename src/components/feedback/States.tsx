import { cva } from "class-variance-authority";
import { CircleAlert, Inbox, RotateCcw, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Contenedor común de estados de feedback (vacío / error).
 * Variantes CVA: el tono solo cambia el color del icono; la composición
 * es idéntica para que el sistema se lea como una sola voz.
 */
const stateContainer = cva(
  "flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center",
  {
    variants: {
      tone: {
        neutral: "[&_[data-slot=state-icon]]:text-muted-foreground",
        destructive: "[&_[data-slot=state-icon]]:text-destructive",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

interface ErrorStateProps {
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn(stateContainer({ tone: "destructive" }), className)}>
      <CircleAlert aria-hidden data-slot="state-icon" className="mb-1 size-8" />
      <p className="font-heading text-xl font-semibold">
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
  /** Icono contextual (p. ej. SearchX en búsqueda, Newspaper en portada). */
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(stateContainer({ tone: "neutral" }), className)}>
      <Icon aria-hidden data-slot="state-icon" className="mb-1 size-8" />
      <p className="font-heading text-xl font-semibold">{title}</p>
      {description && (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
