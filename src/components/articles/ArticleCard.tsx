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

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const categoryMeta = getSourceCategoryMeta(article.source.category);

  return (
    <Card className="group h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link
        href={`/noticia/${article.slug}`}
        className="flex h-full flex-col"
        aria-label={article.title}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{article.source.name}</Badge>
            {categoryMeta && <span>{categoryMeta.label}</span>}
          </div>

          <h3 className="font-serif text-lg font-semibold leading-snug group-hover:underline">
            {article.title}
          </h3>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {article.subtitle}
          </p>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <IdeologyBadge
                ideologyClass={article.ideology.predicted}
                confidence={article.ideology.confidence}
              />
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock aria-hidden className="size-3" />
                {article.readingTimeMinutes} min
              </span>
            </div>
            <IdeologyStrip probabilities={article.ideology.probabilities} />
            <span className="text-xs text-muted-foreground">
              {formatPublishedAt(article.publishedAt)}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
