import Image from "next/image";
import Link from "next/link";

import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { formatPublishedAt } from "@/lib/format";
import type { Article } from "@/types/article";

interface ArticleCardProps {
  article: Article;
}

/**
 * Tile "recorte de prensa": sin caja ni sombra; la cinta de medición corona
 * el recorte y la foto vive en escala de grises hasta el hover (la tinta de
 * color pertenece a la medición, no a la foto).
 */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="group relative flex h-full flex-col focus-within:ring-2 focus-within:ring-ring/60 focus-within:ring-offset-4 focus-within:ring-offset-background motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:ease-out-expo motion-safe:hover:shadow-lg motion-safe:hover:shadow-foreground/15 motion-safe:hover:[transform:perspective(900px)_rotateX(1.6deg)_translateY(-5px)]">
      <Link
        href={`/noticia/${article.slug}`}
        className="flex h-full flex-col outline-none"
        aria-label={article.title}
      >
        <IdeologyStrip
          probabilities={article.ideology.probabilities}
          className="origin-top motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out-expo motion-safe:group-hover:scale-y-150"
        />

        <div className="relative mt-3 aspect-video w-full overflow-hidden bg-muted">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover grayscale motion-safe:transition-[filter] motion-safe:duration-250 motion-safe:ease-out-expo group-hover:grayscale-0 dark:opacity-90"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center font-display text-xl font-bold uppercase tracking-tight text-muted-foreground/50">
              {article.source.name}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 pt-4">
          <p className="font-mono text-xs text-muted-foreground">
            {article.source.name} ·{" "}
            <time dateTime={article.publishedAt}>
              {formatPublishedAt(article.publishedAt)}
            </time>
          </p>

          <h2 className="font-display text-lg font-bold leading-snug tracking-tight">
            {article.title}
          </h2>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {article.subtitle}
          </p>

          <div className="mt-auto pt-3">
            <IdeologyBadge
              ideologyClass={article.ideology.predicted}
              confidence={article.ideology.confidence}
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
