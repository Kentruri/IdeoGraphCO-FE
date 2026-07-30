"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Devuelve las páginas a mostrar, con `null` como elipsis. */
function getVisiblePages(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set<number>([
    1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const withEllipsis: (number | null)[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) {
      withEllipsis.push(null);
    }
    withEllipsis.push(value);
  });
  return withEllipsis;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación de noticias"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <Button
        variant="outline"
        size="icon"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {getVisiblePages(page, totalPages).map((value, index) =>
        value === null ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="px-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={value}
            variant={value === page ? "default" : "outline"}
            size="icon"
            aria-label={`Página ${value}`}
            aria-current={value === page ? "page" : undefined}
            onClick={() => onPageChange(value)}
          >
            {value}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
