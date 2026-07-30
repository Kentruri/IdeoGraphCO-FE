"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { Separator } from "@/components/ui/separator";
import type { SourceCategoryMeta } from "@/lib/site";
import { useGetArticlesQuery } from "@/store/services/articles.api";

const PAGE_SIZE = 9;

interface SourceCategoryPageProps {
  category: SourceCategoryMeta;
}

export function SourceCategoryPage({ category }: SourceCategoryPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("pagina")) || 1);

  const { data, isLoading, isError, refetch } = useGetArticlesQuery({
    page,
    pageSize: PAGE_SIZE,
    sourceCategory: category.slug,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-8 space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Fuentes
        </p>
        <h1 className="font-serif text-3xl font-bold">{category.label}</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          {category.description}
        </p>
      </section>

      <Separator className="mb-8" />

      {isLoading && <ArticleGridSkeleton count={PAGE_SIZE} />}

      {isError && <ErrorState onRetry={refetch} />}

      {data && data.items.length === 0 && (
        <EmptyState
          title={`Sin noticias de fuentes ${category.label.toLowerCase()}`}
          description="Todavía no hay artículos analizados para esta categoría de fuente."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-10">
          <ArticleGrid articles={data.items} />
          <PaginationControls
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(newPage) =>
              router.push(
                newPage === 1
                  ? `/fuentes/${category.slug}`
                  : `/fuentes/${category.slug}?pagina=${newPage}`
              )
            }
          />
          <p className="text-center text-xs text-muted-foreground">
            {data.totalItems} noticias en esta categoría
          </p>
        </div>
      )}
    </div>
  );
}
