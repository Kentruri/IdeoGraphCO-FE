import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SourceCategoryPage } from "@/components/pages/SourceCategoryPage";
import { ArticleGridSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { getSourceCategoryMeta, SOURCE_CATEGORY_META } from "@/lib/site";

interface PageProps {
  params: Promise<{ categoria: string }>;
}

export function generateStaticParams() {
  return SOURCE_CATEGORY_META.map((category) => ({
    categoria: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categoria } = await params;
  const meta = getSourceCategoryMeta(categoria);
  if (!meta) return {};
  return {
    title: `Fuentes ${meta.label.toLowerCase()}`,
    description: meta.description,
  };
}

export default async function SourceCategoryRoute({ params }: PageProps) {
  const { categoria } = await params;
  const categoryMeta = getSourceCategoryMeta(categoria);

  if (!categoryMeta) notFound();

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <ArticleGridSkeleton />
        </div>
      }
    >
      <SourceCategoryPage category={categoryMeta} />
    </Suspense>
  );
}
