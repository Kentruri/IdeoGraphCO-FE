"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";

import { ErrorState } from "@/components/feedback/States";
import { IdeologyAxes } from "@/components/ideology/IdeologyAxes";
import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyDistribution } from "@/components/ideology/IdeologyDistribution";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { CountUp } from "@/components/motion/CountUp";
import { ArticleDetailSkeleton } from "@/components/skeletons/ArticleDetailSkeleton";
import { Button } from "@/components/ui/button";
import { formatConfidence, formatDate } from "@/lib/format";
import { getSourceCategoryMeta } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useGetArticleBySlugQuery } from "@/store/services/articles.api";
import type { ArticleSource } from "@/types/article";
import { IDEOLOGY_META } from "@/types/ideology";

/** Capitular editorial del primer párrafo de la lectura. */
const DROP_CAP =
  "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-extrabold first-letter:leading-[0.85]";

interface ArticleDetailPageProps {
  slug: string;
}

export function ArticleDetailPage({ slug }: ArticleDetailPageProps) {
  const { data: article, isLoading, isError, error, refetch } =
    useGetArticleBySlugQuery(slug);

  if (isError && "status" in error && error.status === 404) {
    notFound();
  }

  /** El representativo: primera fuente en reportar (el adapter las ordena). */
  const lead = article?.sources[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      {isLoading && <ArticleDetailSkeleton />}

      {isError && <ErrorState onRetry={refetch} />}

      {article && (
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_var(--spacing-aside)]">
          <article>
            {/* Miga de pan */}
            <nav
              aria-label="Miga de pan"
              className="mb-8 flex items-center gap-1 font-mono text-xs text-muted-foreground"
            >
              <Link
                href="/noticias"
                className="rounded-sm outline-none transition-colors duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                Noticias
              </Link>
              <ChevronRight aria-hidden className="size-3" />
              <span aria-current="page">
                {getSourceCategoryMeta(article.source.category)?.label ??
                  article.source.category}
              </span>
            </nav>

            <header className="space-y-5">
              <p className="font-mono text-xs text-muted-foreground">
                {article.source.name} ·{" "}
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>{" "}
                ·{" "}
                <span className="tabular-nums">
                  {article.readingTimeMinutes} min de lectura
                </span>
              </p>

              <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-balance md:text-5xl">
                {article.title}
              </h1>

              {article.subtitle && (
                <p className="font-serif text-xl italic leading-8 text-pretty text-muted-foreground">
                  {article.subtitle}
                </p>
              )}

              {article.author && (
                <p className="text-sm font-medium">Por {article.author}</p>
              )}
            </header>

            {article.imageUrl && (
              <figure className="my-10">
                <div className="relative aspect-video w-full border border-border bg-muted">
                  <Image
                    src={article.imageUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover dark:opacity-90"
                  />
                </div>
                <figcaption className="mt-2 font-mono text-xs text-muted-foreground">
                  Imagen: {article.source.name}.
                </figcaption>
              </figure>
            )}

            {/* Lectura: la síntesis si existe; si no, el snippet del primer
                medio y el enlace al original (CONTRACT.md del BE, regla 1). */}
            {article.synthesized ? (
              <section aria-label="Síntesis generada por IA" className="max-w-prose">
                <p className="mb-8 border-l-2 border-foreground/40 pl-3 font-mono text-xs leading-5 text-muted-foreground">
                  {article.synthesized.disclaimer}
                </p>
                {article.synthesized.title !== article.title && (
                  <h2 className="mb-6 font-serif text-2xl font-semibold leading-tight text-balance">
                    {article.synthesized.title}
                  </h2>
                )}
                <div className="space-y-6">
                  {article.synthesized.body.map((paragraph, index) => (
                    <p
                      key={index}
                      className={cn(
                        "font-serif text-lg leading-8",
                        index === 0 && DROP_CAP
                      )}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-6 font-mono text-[11px] text-muted-foreground">
                  Síntesis de {article.sourcesCount} fuentes con{" "}
                  {article.synthesized.model} ·{" "}
                  <time dateTime={article.synthesized.generatedAt}>
                    {formatDate(article.synthesized.generatedAt)}
                  </time>
                </p>
              </section>
            ) : (
              lead && (
                <div className="max-w-prose space-y-6">
                  <p className={cn("font-serif text-lg leading-8", DROP_CAP)}>
                    {lead.snippet}
                  </p>
                  <Button asChild variant="outline">
                    <a href={lead.url} target="_blank" rel="noopener noreferrer">
                      Leer en {lead.name}
                      <ArrowUpRight aria-hidden />
                      <span className="sr-only">
                        (se abre en una pestaña nueva)
                      </span>
                    </a>
                  </Button>
                </div>
              )
            )}

            {article.sources.length > 1 && (
              <section
                aria-labelledby="cobertura"
                className="mt-12 border-t border-border pt-8"
              >
                <h2
                  id="cobertura"
                  className="font-display text-2xl font-bold tracking-tight"
                >
                  Cobertura
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  <span className="tabular-nums">{article.sources.length}</span>{" "}
                  medios cubren esta historia, cada uno con su propia
                  clasificación.
                </p>
                <ol className="mt-4 divide-y divide-border">
                  {article.sources.map((source, index) => (
                    <SourceItem
                      key={source.id}
                      source={source}
                      // El snippet del primer medio ya es la lectura principal
                      // cuando no hay síntesis.
                      showSnippet={article.synthesized !== null || index > 0}
                    />
                  ))}
                </ol>
              </section>
            )}

            {article.keywords.length > 0 && (
              <ul
                aria-label="Palabras clave"
                className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6"
              >
                {article.keywords.map((keyword) => (
                  <li
                    key={keyword}
                    className="border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* Ficha de medición (offset = header + un paso de respiración). */}
          <aside className="lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:self-start">
            <section
              aria-label="Análisis ideológico"
              className="rule-double bg-card px-6 pb-6 pt-5 ring-1 ring-border sm:px-7 sm:pb-7"
            >
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Análisis ideológico
              </h2>

              <div className="mt-6 space-y-2">
                <IdeologyBadge
                  ideologyClass={article.ideology.predicted}
                  size="md"
                />
                <p className="text-sm leading-6 text-muted-foreground">
                  {IDEOLOGY_META[article.ideology.predicted].description}
                </p>
              </div>

              <div className="mt-6 flex items-baseline gap-3 border-t border-border pt-5">
                <p className="font-mono text-4xl font-semibold tabular-nums">
                  <CountUp
                    value={article.ideology.confidence}
                    format={formatConfidence}
                  />
                </p>
                <p className="text-sm text-muted-foreground">
                  de confianza del modelo
                </p>
              </div>

              <IdeologyStrip
                probabilities={article.ideology.probabilities}
                className="my-6 h-2"
              />

              <IdeologyDistribution
                probabilities={article.ideology.probabilities}
                predicted={article.ideology.predicted}
              />

              <div className="mt-7 border-t border-border pt-5">
                <h3 className="text-sm font-semibold">Tensiones</h3>
                <p className="mb-4 mt-1 text-xs leading-5 text-muted-foreground">
                  Peso relativo dentro de cada par de clases opuestas.
                </p>
                <IdeologyAxes probabilities={article.ideology.probabilities} />
              </div>

              <p className="mt-7 border-t border-border pt-4 font-mono text-[11px] leading-5 text-muted-foreground">
                Clasificación generada automáticamente (modelo{" "}
                {article.ideology.modelVersion})
                {article.sourcesCount > 1 &&
                  ` sobre el artículo de ${article.source.name}, el primero en reportar`}
                . La distribución suma 1 y describe el encuadre dominante del
                texto, no la veracidad de los hechos.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

/** Un medio de la cobertura: enlace al original y su propia clasificación. */
function SourceItem({
  source,
  showSnippet,
}: {
  source: ArticleSource;
  showSnippet: boolean;
}) {
  return (
    <li className="py-5">
      <p className="font-mono text-xs text-muted-foreground">
        {source.name} ·{" "}
        {getSourceCategoryMeta(source.category)?.label ?? source.category} ·{" "}
        <time dateTime={source.publishedAt}>
          {formatDate(source.publishedAt)}
        </time>
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
