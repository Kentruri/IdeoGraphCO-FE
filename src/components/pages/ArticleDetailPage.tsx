"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ErrorState } from "@/components/feedback/States";
import { IdeologyAxes } from "@/components/ideology/IdeologyAxes";
import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyDistribution } from "@/components/ideology/IdeologyDistribution";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { CountUp } from "@/components/motion/CountUp";
import { ArticleDetailSkeleton } from "@/components/skeletons/ArticleDetailSkeleton";
import { formatConfidence, formatDate } from "@/lib/format";
import { getSourceCategoryMeta } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useGetArticleBySlugQuery } from "@/store/services/articles.api";
import { IDEOLOGY_META } from "@/types/ideology";

interface ArticleDetailPageProps {
  slug: string;
}

export function ArticleDetailPage({ slug }: ArticleDetailPageProps) {
  const { data: article, isLoading, isError, error, refetch } =
    useGetArticleBySlugQuery(slug);

  if (isError && "status" in error && error.status === 404) {
    notFound();
  }

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

              <p className="font-serif text-xl italic leading-8 text-pretty text-muted-foreground">
                {article.subtitle}
              </p>

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
                  Imagen de referencia (datos de demostración).
                </figcaption>
              </figure>
            )}

            {/* Lectura larga en serif con capitular editorial. */}
            <div className="max-w-prose space-y-6">
              {article.body.map((paragraph, index) => (
                <p
                  key={index}
                  className={cn(
                    "font-serif text-lg leading-8",
                    index === 0 &&
                      "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-extrabold first-letter:leading-[0.85]"
                  )}
                >
                  {paragraph}
                </p>
              ))}
            </div>

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
                {article.ideology.modelVersion}). La distribución suma 1 y
                describe el encuadre dominante del texto, no la veracidad de
                los hechos.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
