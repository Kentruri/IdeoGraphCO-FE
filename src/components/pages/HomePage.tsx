"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { FeaturedArticleCard } from "@/components/articles/FeaturedArticleCard";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { Separator } from "@/components/ui/separator";
import { SITE_DESCRIPTION } from "@/lib/site";
import { useGetArticlesQuery } from "@/store/services/articles.api";
import { IDEOLOGY_DISPLAY_ORDER, IDEOLOGY_META } from "@/types/ideology";

const PAGE_SIZE = 9;

export function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("pagina")) || 1);

  const { data, isLoading, isError, refetch } = useGetArticlesQuery({
    page,
    pageSize: PAGE_SIZE,
  });

  const showFeatured = page === 1 && (data?.items.length ?? 0) > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Encabezado editorial */}
      <section className="mb-10 space-y-4">
        <h1 className="max-w-3xl font-serif text-3xl font-bold leading-tight md:text-4xl">
          La orientación ideológica de las noticias políticas, medida y visible
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {SITE_DESCRIPTION}
        </p>
        <ul
          aria-label="Las ocho clases ideológicas"
          className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1"
        >
          {IDEOLOGY_DISPLAY_ORDER.map((ideologyClass) => {
            const meta = IDEOLOGY_META[ideologyClass];
            return (
              <li
                key={ideologyClass}
                title={meta.description}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: meta.cssVar }}
                />
                {meta.label}
              </li>
            );
          })}
        </ul>
      </section>

      <Separator className="mb-10" />

      {isLoading && <ArticleGridSkeleton count={PAGE_SIZE} />}

      {isError && <ErrorState onRetry={refetch} />}

      {data && data.items.length === 0 && (
        <EmptyState title="Aún no hay noticias analizadas" />
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-10">
          {showFeatured && <FeaturedArticleCard article={data.items[0]} />}
          <ArticleGrid
            articles={showFeatured ? data.items.slice(1) : data.items}
          />
          <PaginationControls
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(newPage) =>
              router.push(newPage === 1 ? "/" : `/?pagina=${newPage}`)
            }
          />
          <p className="text-center text-xs text-muted-foreground">
            {data.totalItems} noticias analizadas
          </p>
        </div>
      )}
    </div>
  );
}
