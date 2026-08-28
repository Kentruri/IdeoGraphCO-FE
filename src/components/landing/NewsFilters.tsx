"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SOURCE_CATEGORY_META } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { SourceCategory } from "@/types/article";
import {
  IDEOLOGY_META,
  IDEOLOGY_DISPLAY_ORDER,
  type IdeologyClass,
} from "@/types/ideology";

export interface NewsFiltersValue {
  ideologies: IdeologyClass[];
  category: SourceCategory | "todas";
  from: string;
  to: string;
}

export const EMPTY_FILTERS: NewsFiltersValue = {
  ideologies: [],
  category: "todas",
  from: "",
  to: "",
};

interface NewsFiltersProps {
  value: NewsFiltersValue;
  onChange: (value: NewsFiltersValue) => void;
}

export function hasActiveFilters(value: NewsFiltersValue): boolean {
  return (
    value.ideologies.length > 0 ||
    value.category !== "todas" ||
    value.from !== "" ||
    value.to !== ""
  );
}

/**
 * Barra de filtros de la portada, con voz de prensa: la ideología se marca
 * con sellos (multiselección), la fuente con pestañas de archivo y el rango
 * de fechas con la línea de cierre de edición.
 */
export function NewsFilters({ value, onChange }: NewsFiltersProps) {
  const toggleIdeology = (ideologyClass: IdeologyClass) => {
    const active = value.ideologies.includes(ideologyClass);
    onChange({
      ...value,
      ideologies: active
        ? value.ideologies.filter((entry) => entry !== ideologyClass)
        : [...value.ideologies, ideologyClass],
    });
  };

  return (
    <div className="space-y-5 border-b border-border pb-6">
      {/* Sellos de ideología (multiselección) */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span
          id="filtro-ideologia"
          className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
        >
          Tinta
        </span>
        <div
          role="group"
          aria-labelledby="filtro-ideologia"
          className="flex flex-wrap gap-1.5"
        >
          {IDEOLOGY_DISPLAY_ORDER.map((ideologyClass) => {
            const meta = IDEOLOGY_META[ideologyClass];
            const pressed = value.ideologies.includes(ideologyClass);
            return (
              <button
                key={ideologyClass}
                type="button"
                aria-pressed={pressed}
                onClick={() => toggleIdeology(ideologyClass)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs outline-none transition-[color,background-color,border-color,transform,box-shadow] duration-150 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring/60 active:translate-y-px",
                  pressed
                    ? "border-foreground/60 bg-secondary font-medium text-foreground shadow-xs motion-safe:-rotate-1"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.cssVar }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pestañas de archivo (categoría de fuente) */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span
          id="filtro-fuente"
          className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted-foreground"
        >
          Archivo
        </span>
        <div
          role="group"
          aria-labelledby="filtro-fuente"
          className="-mb-px flex max-w-full items-end gap-1 overflow-x-auto border-b border-border"
        >
          <ArchiveTab
            active={value.category === "todas"}
            onClick={() => onChange({ ...value, category: "todas" })}
          >
            Todas
          </ArchiveTab>
          {SOURCE_CATEGORY_META.map((category) => (
            <ArchiveTab
              key={category.slug}
              active={value.category === category.slug}
              onClick={() => onChange({ ...value, category: category.slug })}
            >
              {category.label}
            </ArchiveTab>
          ))}
        </div>
      </div>

      {/* Cierre de edición (rango de fechas) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          Edición
        </span>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          desde
          <input
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(event) =>
              onChange({ ...value, from: event.target.value })
            }
            className="h-8 border-0 border-b border-input bg-transparent px-1 font-mono text-xs text-foreground outline-none transition-colors duration-150 ease-out-expo focus-visible:border-foreground"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          hasta
          <input
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
            className="h-8 border-0 border-b border-input bg-transparent px-1 font-mono text-xs text-foreground outline-none transition-colors duration-150 ease-out-expo focus-visible:border-foreground"
          />
        </label>
        {hasActiveFilters(value) && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X aria-hidden className="size-3.5" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function ArchiveTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "-mb-px shrink-0 cursor-pointer whitespace-nowrap border border-b-0 px-3 py-1.5 text-xs outline-none transition-colors duration-150 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "border-border bg-background font-medium text-foreground shadow-[0_1px_0_0_var(--background)]"
          : "border-transparent text-muted-foreground hover:border-border/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
