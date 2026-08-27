"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SearchX } from "lucide-react";

import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { PaginationControls } from "@/components/articles/PaginationControls";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { SearchBar } from "@/components/search/SearchBar";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { Separator } from "@/components/ui/separator";
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-8 space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Buscar noticias
        </h1>
        <SearchBar
          key={query}
          initialQuery={query}
          className="max-w-xl"
          placeholder="Título, subtítulo, medio o palabra clave…"
        />
        {query && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Resultados para <span className="font-medium">«{query}»</span>
            {data ? (
              <>
                :{" "}
                <span className="font-mono tabular-nums">
                  {data.totalItems}
                </span>{" "}
                coincidencias
              </>
            ) : null}
          </p>
        )}
      </section>

      <Separator className="mb-8" />

      {!query && (
        <EmptyState
          icon={Search}
          title="Escribe un término para buscar"
          description="Puedes buscar por título, subtítulo, nombre del medio o palabras clave."
        />
      )}

      {query && isLoading && <ArticleGridSkeleton count={PAGE_SIZE} />}

      {query && isError && <ErrorState onRetry={refetch} />}

      {query && data && data.items.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={`Sin resultados para «${query}»`}
          description="Intenta con otro término o revisa la ortografía."
        />
      )}

      {query && data && data.items.length > 0 && (
        <div className="space-y-10">
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
  );
}
