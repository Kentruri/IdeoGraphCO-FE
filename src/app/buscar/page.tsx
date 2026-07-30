import { Suspense } from "react";
import type { Metadata } from "next";

import { SearchPage } from "@/components/pages/SearchPage";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Busca noticias políticas analizadas por el clasificador.",
};

export default function SearchRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <ArticleGridSkeleton />
        </div>
      }
    >
      <SearchPage />
    </Suspense>
  );
}
