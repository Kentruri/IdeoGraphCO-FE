"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
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
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <section className="space-y-4">
        <nav
          aria-label="Miga de pan"
          className="flex items-center gap-1 font-mono text-xs text-muted-foreground"
        >
          <Link
            href="/"
            className="rounded-sm outline-none transition-colors duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            Portada
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          <span aria-current="page">fuentes {category.label.toLowerCase()}</span>
        </nav>

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="font-display text-[clamp(2.25rem,9.5vw,4.5rem)] font-extrabold uppercase leading-none tracking-tight motion-safe:animate-fade-up md:font-stretch-expanded">
            {category.label}
          </h1>
          {data && (
            <p className="font-mono text-sm tabular-nums text-muted-foreground">
              {data.totalItems} noticias
            </p>
          )}
        </div>
        <p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">
          {category.description}
        </p>
      </section>

      <div className="rule-double mt-10 pt-12">
        {isLoading && <ArticleGridSkeleton count={PAGE_SIZE} />}

        {isError && <ErrorState onRetry={refetch} />}

        {data && data.items.length === 0 && (
          <EmptyState
            title={`Sin noticias de fuentes ${category.label.toLowerCase()}`}
            description="Todavía no hay artículos analizados para esta categoría de fuente."
          />
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-16">
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
          </div>
        )}
      </div>
    </div>
  );
}
