import { RotateCcw, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
      <p className="text-lg font-semibold">No pudimos cargar las noticias</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocurrió un error al consultar la API. Verifica tu conexión e inténtalo
        de nuevo.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RotateCcw className="size-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
      <SearchX aria-hidden className="size-8 text-muted-foreground" />
      <p className="text-lg font-semibold">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
