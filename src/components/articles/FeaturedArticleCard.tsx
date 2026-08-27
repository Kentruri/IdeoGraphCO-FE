import Image from "next/image";
import Link from "next/link";

import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { formatPublishedAt } from "@/lib/format";
import { getSourceCategoryMeta } from "@/lib/site";
import type { Article } from "@/types/article";

interface FeaturedArticleCardProps {
  article: Article;
}

/** Apertura de portada: foto a 7 columnas y titular editorial a 5. */
export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  const categoryMeta = getSourceCategoryMeta(article.source.category);

  return (
    <article className="group relative border-b border-border pb-16 focus-within:ring-2 focus-within:ring-ring/60 focus-within:ring-offset-4 focus-within:ring-offset-background">
      <Link
        href={`/noticia/${article.slug}`}
        className="grid gap-6 outline-none md:grid-cols-12 md:gap-8"
        aria-label={article.title}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted md:col-span-7">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover grayscale motion-safe:transition-[filter,transform] motion-safe:duration-250 motion-safe:ease-out-expo group-hover:grayscale-0 motion-safe:group-hover:scale-[1.015] dark:opacity-90"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center font-display text-3xl font-bold uppercase tracking-tight text-muted-foreground/50">
              {article.source.name}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 md:col-span-5">
          <p className="font-mono text-xs text-muted-foreground">
            {article.source.name}
            {categoryMeta ? ` · ${categoryMeta.label}` : ""} ·{" "}
            <time dateTime={article.publishedAt}>
              {formatPublishedAt(article.publishedAt)}
            </time>
          </p>

          <h2 className="font-display text-3xl font-extrabold leading-[1.02] tracking-tight text-balance md:text-4xl lg:text-[2.75rem]">
            {article.title}
          </h2>

          <p className="text-base leading-7 text-pretty text-muted-foreground">
            {article.subtitle}
          </p>

          <div className="mt-auto space-y-3 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <IdeologyBadge
                ideologyClass={article.ideology.predicted}
                confidence={article.ideology.confidence}
                size="md"
              />
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {article.readingTimeMinutes} min de lectura
              </span>
            </div>
            <IdeologyStrip
              probabilities={article.ideology.probabilities}
              className="h-1.5"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
