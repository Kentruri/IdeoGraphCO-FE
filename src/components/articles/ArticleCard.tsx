import Image from "next/image";
import Link from "next/link";

import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPublishedAt } from "@/lib/format";
import { getSourceCategoryMeta } from "@/lib/site";
import type { Article } from "@/types/article";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const categoryMeta = getSourceCategoryMeta(article.source.category);

  return (
    <Card className="group relative h-full gap-0 overflow-hidden py-0 transition-shadow duration-200 ease-swift focus-within:ring-2 focus-within:ring-ring/60 hover:shadow-md">
      <Link
        href={`/noticia/${article.slug}`}
        className="flex h-full flex-col outline-none"
        aria-label={article.title}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-swift motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-2xl italic text-muted-foreground/60">
              {article.source.name}
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Badge variant="outline">{article.source.name}</Badge>
            {categoryMeta && <span>{categoryMeta.label}</span>}
            <span aria-hidden>·</span>
            <time dateTime={article.publishedAt}>
              {formatPublishedAt(article.publishedAt)}
            </time>
          </div>

          <h2 className="font-heading text-lg font-semibold leading-snug">
            {article.title}
          </h2>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {article.subtitle}
          </p>

          <div className="mt-auto flex flex-col gap-2.5 pt-2">
            <IdeologyBadge
              ideologyClass={article.ideology.predicted}
              confidence={article.ideology.confidence}
              className="self-start"
            />
            <IdeologyStrip probabilities={article.ideology.probabilities} />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
