import { Suspense } from "react";

import { Hero } from "@/components/landing/Hero";
import { MethodSection } from "@/components/landing/MethodSection";
import { NewsFeed } from "@/components/landing/NewsFeed";
import { TensionAxes } from "@/components/landing/TensionAxes";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";

export default function Home() {
  return (
    <>
      <Hero />
      <TensionAxes />
      <MethodSection />
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
            <ArticleGridSkeleton featured />
          </div>
        }
      >
        <NewsFeed />
      </Suspense>
    </>
  );
}
