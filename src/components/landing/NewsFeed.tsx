"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { FeaturedArticleCard } from "@/components/articles/FeaturedArticleCard";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { SectionOpen } from "@/components/landing/SectionOpen";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { useGetArticlesQuery } from "@/store/services/articles.api";

const PAGE_SIZE = 9;

/** Sección de portada: noticias analizadas, paginadas con ?pagina=N. */
export function NewsFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("pagina")) || 1);

  const { data, isLoading, isError, refetch } = useGetArticlesQuery({
    page,
    pageSize: PAGE_SIZE,
  });

  const showFeatured = page === 1 && (data?.items.length ?? 0) > 0;

  return (
    <section
      id="portada"
      aria-label="Noticias analizadas"
      className="mx-auto w-full max-w-7xl scroll-mt-header px-4 pb-24 pt-24 sm:px-6 md:pt-32"
    >
      <SectionOpen
        title="En la portada"
        aside={
          data ? (
            <p className="font-mono text-sm tabular-nums text-muted-foreground">
              {data.totalItems} noticias analizadas
            </p>
          ) : undefined
        }
      />

      <div className="mt-12">
        {isLoading && <ArticleGridSkeleton count={PAGE_SIZE} featured={page === 1} />}

        {isError && <ErrorState onRetry={refetch} />}

        {data && data.items.length === 0 && (
          <EmptyState
            title="Aún no hay noticias analizadas"
            description="Cuando el clasificador procese los primeros artículos aparecerán aquí."
          />
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-16">
            {showFeatured && <FeaturedArticleCard article={data.items[0]} />}
            <ArticleGrid
              articles={showFeatured ? data.items.slice(1) : data.items}
            />
            <PaginationControls
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={(newPage) =>
                router.push(
                  newPage === 1 ? "/#portada" : `/?pagina=${newPage}#portada`
                )
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
