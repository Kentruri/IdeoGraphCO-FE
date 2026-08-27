import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPublishedAt } from "@/lib/format";
import { getSourceCategoryMeta } from "@/lib/site";
import type { Article } from "@/types/article";

interface FeaturedArticleCardProps {
  article: Article;
}

/** Variante destacada: ocupa el ancho completo con imagen lateral. */
export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  const categoryMeta = getSourceCategoryMeta(article.source.category);

  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-shadow duration-200 ease-swift focus-within:ring-2 focus-within:ring-ring/60 hover:shadow-md">
      <Link
        href={`/noticia/${article.slug}`}
        className="grid outline-none md:grid-cols-2"
        aria-label={article.title}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted md:aspect-auto md:min-h-80">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-swift motion-safe:group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-3xl italic text-muted-foreground/60">
              {article.source.name}
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Badge variant="outline">{article.source.name}</Badge>
            {categoryMeta && <span>{categoryMeta.label}</span>}
            <span aria-hidden>·</span>
            <time dateTime={article.publishedAt}>
              {formatPublishedAt(article.publishedAt)}
            </time>
          </div>

          <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight text-balance md:text-3xl">
            {article.title}
          </h2>

          <p className="text-base leading-7 text-muted-foreground">
            {article.subtitle}
          </p>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <IdeologyBadge
                ideologyClass={article.ideology.predicted}
                confidence={article.ideology.confidence}
                size="md"
              />
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock aria-hidden className="size-3" />
                {article.readingTimeMinutes} min de lectura
              </span>
            </div>
            <IdeologyStrip probabilities={article.ideology.probabilities} />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
