import { ArrowUpRight } from "lucide-react";

import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { formatDate } from "@/lib/format";
import { getSourceCategoryMeta } from "@/lib/site";
import type { ArticleSource } from "@/types/article";

/** Un medio de la cobertura: enlace al original y su propia clasificación. */
export function SourceItem({
  source,
  showSnippet,
  note,
}: {
  source: ArticleSource;
  showSnippet: boolean;
  /** Marca corta junto a la fecha (p. ej. «noticia clasificada»). */
  note?: string;
}) {
  return (
    <li className="py-5">
      <p className="font-mono text-xs text-muted-foreground">
        {source.name} ·{" "}
        {getSourceCategoryMeta(source.category)?.label ?? source.category} ·{" "}
        <time dateTime={source.publishedAt}>
          {formatDate(source.publishedAt)}
        </time>
        {note && <span className="text-foreground"> · {note}</span>}
      </p>
      <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-pretty">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm underline-offset-4 outline-none transition-colors duration-150 ease-out-expo hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {source.title}
          <ArrowUpRight
            aria-hidden
            className="ml-1 inline size-4 align-[-0.125em] text-muted-foreground"
          />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>
      </h3>
      {source.author && (
        <p className="mt-1 text-xs text-muted-foreground">
          Por {source.author}
        </p>
      )}
      {showSnippet && (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {source.snippet}
        </p>
      )}
      <div className="mt-3">
        {source.ideology ? (
          <div className="flex flex-wrap items-center gap-3">
            <IdeologyBadge
              ideologyClass={source.ideology.predicted}
              confidence={source.ideology.confidence}
            />
            <IdeologyStrip
              probabilities={source.ideology.probabilities}
              className="w-40"
            />
          </div>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">
            Clasificación pendiente
          </p>
        )}
      </div>
    </li>
  );
}
