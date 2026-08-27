"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { SearchBar } from "@/components/search/SearchBar";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { useGetArticlesQuery } from "@/store/services/articles.api";

const PAGE_SIZE = 9;

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("pagina")) || 1);

  const { data, isLoading, isError, refetch } = useGetArticlesQuery(
    { page, pageSize: PAGE_SIZE, q: query },
    { skip: query.length === 0 }
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <section className="space-y-8">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight motion-safe:animate-fade-up md:font-stretch-expanded md:text-7xl">
          Buscar
        </h1>
        <SearchBar
          key={query}
          initialQuery={query}
          size="hero"
          className="max-w-2xl motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]"
          placeholder="Título, subtítulo, medio o palabra clave…"
        />
        {query && (
          <p aria-live="polite" className="font-mono text-sm text-muted-foreground">
            «{query}»
            {data ? (
              <>
                {" "}· <span className="tabular-nums">{data.totalItems}</span>{" "}
                coincidencias
              </>
            ) : null}
          </p>
        )}
      </section>

      <div className="mt-12">
        {!query && (
          <EmptyState
            title="Escribe un término para buscar"
            description="Puedes buscar por título, subtítulo, nombre del medio o palabras clave."
          />
        )}

        {query && isLoading && <ArticleGridSkeleton count={PAGE_SIZE} />}

        {query && isError && <ErrorState onRetry={refetch} />}

        {query && data && data.items.length === 0 && (
          <EmptyState
            title={`Sin resultados para «${query}»`}
            description="Intenta con otro término o revisa la ortografía."
          />
        )}

        {query && data && data.items.length > 0 && (
          <div className="space-y-16">
            <ArticleGrid articles={data.items} />
            <PaginationControls
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={(newPage) =>
                router.push(
                  `/buscar?q=${encodeURIComponent(query)}${
                    newPage === 1 ? "" : `&pagina=${newPage}`
                  }`
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
