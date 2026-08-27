"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Newspaper } from "lucide-react";

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
      <section className="mb-8 space-y-3">
        <nav
          aria-label="Miga de pan"
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <Link
            href="/"
            className="rounded-sm outline-none transition-colors duration-150 ease-swift hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            Portada
          </Link>
          <ChevronRight aria-hidden className="size-3.5" />
          <span aria-current="page">Fuentes {category.label.toLowerCase()}</span>
        </nav>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {category.label}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-pretty text-muted-foreground">
          {category.description}
        </p>
      </section>

      <Separator className="mb-8" />

      {isLoading && <ArticleGridSkeleton count={PAGE_SIZE} />}

      {isError && <ErrorState onRetry={refetch} />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={Newspaper}
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
            <span className="font-mono tabular-nums">{data.totalItems}</span>{" "}
            noticias en esta categoría
          </p>
        </div>
      )}
    </div>
  );
}
