"use client";

import { useMemo, useState } from "react";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { FeaturedArticleCard } from "@/components/articles/FeaturedArticleCard";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  NewsFilters,
  type NewsFiltersValue,
} from "@/components/landing/NewsFilters";
import { SectionOpen } from "@/components/landing/SectionOpen";
import { Button } from "@/components/ui/button";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { cn } from "@/lib/utils";
import { useGetArticlesQuery } from "@/store/services/articles.api";
import type { ArticleListParams } from "@/types/article";

const PAGE_SIZE = 9;

/** Instante UTC (ISO) de una hora local del día `YYYY-MM-DD` del navegador. */
function localDayBound(day: string, time: string): string | undefined {
  if (!day) return undefined;
  const instant = new Date(`${day}T${time}`);
  return Number.isNaN(instant.getTime()) ? undefined : instant.toISOString();
}

/** Filtros de la UI → parámetros de `GET /stories` (los aplica el servidor). */
function toListParams(filters: NewsFiltersValue): ArticleListParams {
  return {
    sourceCategory: filters.category === "todas" ? undefined : filters.category,
    // Ordenadas: la misma selección comparte caché sin importar el orden de clic
    ideologies:
      filters.ideologies.length > 0 ? [...filters.ideologies].sort() : undefined,
    // Días del navegador, de su medianoche al último milisegundo
    publishedFrom: localDayBound(filters.from, "00:00:00"),
    publishedTo: localDayBound(filters.to, "23:59:59.999"),
  };
}

/**
 * Sección única de noticias con paginación de servidor: cada cambio de
 * filtro (sellos de ideología, pestañas de archivo, cierre de edición) o de
 * página es una petición a `GET /stories`, y el contador y las páginas salen
 * de `totalItems`/`totalPages`, así que recorren todo el corpus.
 */
export function NewsFeed({ standalone = false }: { standalone?: boolean }) {
  const [filters, setFiltersState] = useState<NewsFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const setFilters = (value: NewsFiltersValue) => {
    setFiltersState(value);
    setPage(1);
  };

  const filtering = hasActiveFilters(filters);
  const listParams = useMemo(() => toListParams(filters), [filters]);

  // `data` conserva la respuesta anterior mientras llega la nueva: la página
  // no salta a un esqueleto en cada clic, solo se atenúa.
  const { data, isLoading, isFetching, isError, refetch } =
    useGetArticlesQuery({ ...listParams, page, pageSize: PAGE_SIZE });
  // Total del corpus para «N de M»: la página 1 sin filtros, la misma
  // consulta (y caché) que la vista sin filtros.
  const { data: corpus } = useGetArticlesQuery({
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = Math.min(page, totalPages);
  const featured = !filtering && data?.page === 1 ? items[0] : undefined;
  const gridItems = featured ? items.slice(1) : items;

  const changePage = (newPage: number) => {
    setPage(newPage);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    document
      .getElementById("noticias")
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      id="noticias"
      aria-label="Noticias analizadas"
      className={
        standalone
          ? "mx-auto w-full max-w-7xl scroll-mt-header px-4 pb-24 pt-12 sm:px-6"
          : "mx-auto w-full max-w-7xl scroll-mt-header px-4 pb-24 pt-24 sm:px-6 md:pt-32"
      }
    >
      <SectionOpen
        as={standalone ? "h1" : "h2"}
        title="Noticias"
        aside={
          data ? (
            <p
              aria-live="polite"
              className="font-mono text-sm tabular-nums text-muted-foreground"
            >
              {!filtering
                ? `${data.totalItems} noticias analizadas`
                : corpus
                  ? `${data.totalItems} de ${corpus.totalItems} noticias`
                  : `${data.totalItems} noticias`}
            </p>
          ) : undefined
        }
      />

      <div className="mt-8">
        <NewsFilters value={filters} onChange={setFilters} />
      </div>

      <div className="mt-12">
        {isLoading && <ArticleGridSkeleton count={PAGE_SIZE} featured />}

        {isError && <ErrorState onRetry={refetch} />}

        {!isError && data && items.length === 0 && (
          <EmptyState
            title={
              filtering
                ? "Sin noticias con esos filtros"
                : "Aún no hay noticias analizadas"
            }
            description={
              filtering
                ? "Ninguna pieza del archivo coincide con la combinación elegida."
                : "Cuando el clasificador procese los primeros artículos aparecerán aquí."
            }
            action={
              filtering ? (
                <Button
                  variant="outline"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        )}

        {!isError && items.length > 0 && (
          <div
            aria-busy={isFetching}
            className={cn(
              "space-y-16 transition-opacity duration-150 ease-out-expo",
              isFetching && "opacity-60"
            )}
          >
            {featured && <FeaturedArticleCard article={featured} />}
            <ArticleGrid articles={gridItems} />
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
