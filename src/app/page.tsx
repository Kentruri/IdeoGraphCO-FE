import { Suspense } from "react";

import { HomePage } from "@/components/pages/HomePage";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <ArticleGridSkeleton />
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
