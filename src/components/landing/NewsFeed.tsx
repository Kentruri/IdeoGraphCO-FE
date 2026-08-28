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
import { useGetArticlesQuery } from "@/store/services/articles.api";
import type { Article } from "@/types/article";

const PAGE_SIZE = 9;
/** El corpus de demostración cabe en una página del endpoint (26 ≤ 50). */
const CORPUS_FETCH_SIZE = 50;

function applyFilters(
  articles: Article[],
  filters: NewsFiltersValue
): Article[] {
  const fromTime = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const toTime = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

  return articles.filter((article) => {
    if (
      filters.ideologies.length > 0 &&
      !filters.ideologies.includes(article.ideology.predicted)
    ) {
      return false;
    }
    if (
      filters.category !== "todas" &&
      article.source.category !== filters.category
    ) {
      return false;
    }
    const published = new Date(article.publishedAt);
    if (fromTime && published < fromTime) return false;
    if (toTime && published > toTime) return false;
    return true;
  });
}

/**
 * Sección única de noticias: el corpus completo se trae en una llamada al
 * endpoint existente y los filtros/paginación viven en la capa de UI
 * (sellos de ideología, pestañas de archivo y cierre de edición).
 */
export function NewsFeed({ standalone = false }: { standalone?: boolean }) {
  const { data, isLoading, isError, refetch } = useGetArticlesQuery({
    page: 1,
    pageSize: CORPUS_FETCH_SIZE,
  });

  const [filters, setFiltersState] = useState<NewsFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const setFilters = (value: NewsFiltersValue) => {
    setFiltersState(value);
    setPage(1);
  };

  const filtered = useMemo(
    () => applyFilters(data?.items ?? [], filters),
    [data, filters]
  );

  const filtering = hasActiveFilters(filters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const featured = !filtering && safePage === 1 ? pageItems[0] : undefined;
  const gridItems = featured ? pageItems.slice(1) : pageItems;

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
              {filtering
                ? `${filtered.length} de ${data.totalItems} noticias`
                : `${data.totalItems} noticias analizadas`}
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

        {data && filtered.length === 0 && (
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

        {filtered.length > 0 && (
          <div className="space-y-16">
            {featured && <FeaturedArticleCard article={featured} />}
            <ArticleGrid articles={gridItems} />
            <PaginationControls
              page={safePage}
              totalPages={totalPages}
              onPageChange={changePage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
