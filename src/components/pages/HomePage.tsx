"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Newspaper } from "lucide-react";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { FeaturedArticleCard } from "@/components/articles/FeaturedArticleCard";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { IdeologyLegend } from "@/components/ideology/IdeologyLegend";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { Separator } from "@/components/ui/separator";
import { SITE_DESCRIPTION } from "@/lib/site";
import { useGetArticlesQuery } from "@/store/services/articles.api";

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
      {/* Encabezado editorial: titular de portada + la leyenda de 8 clases
          como firma visual del producto (docs/design-system.md §1). */}
      <section className="mb-10 space-y-5">
        <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight text-balance md:text-5xl">
          La orientación ideológica de las noticias políticas, medida y visible
        </h1>
        <p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground">
          {SITE_DESCRIPTION}
        </p>
        <IdeologyLegend />
      </section>

      <Separator className="mb-10" />

      {isLoading && <ArticleGridSkeleton count={PAGE_SIZE} />}

      {isError && <ErrorState onRetry={refetch} />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="Aún no hay noticias analizadas"
          description="Cuando el clasificador procese los primeros artículos aparecerán aquí."
        />
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
            <span className="font-mono tabular-nums">{data.totalItems}</span>{" "}
            noticias analizadas
          </p>
        </div>
      )}
    </div>
  );
}
