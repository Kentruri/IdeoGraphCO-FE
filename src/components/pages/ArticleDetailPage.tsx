"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";

import { ErrorState } from "@/components/feedback/States";
import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyDistribution } from "@/components/ideology/IdeologyDistribution";
import { ArticleDetailSkeleton } from "@/components/skeletons/ArticleDetailSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatConfidence, formatDate } from "@/lib/format";
import { getSourceCategoryMeta } from "@/lib/site";
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {isLoading && <ArticleDetailSkeleton />}

      {isError && <ErrorState onRetry={refetch} />}

      {article && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_var(--spacing-aside)]">
          <article>
            {/* Miga de pan */}
            <nav
              aria-label="Miga de pan"
              className="mb-6 flex items-center gap-1 text-sm text-muted-foreground"
            >
              <Link
                href="/"
                className="rounded-sm outline-none transition-colors duration-150 ease-swift hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                Portada
              </Link>
              <ChevronRight aria-hidden className="size-3.5" />
              <Link
                href={`/fuentes/${article.source.category}`}
                className="rounded-sm outline-none transition-colors duration-150 ease-swift hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {getSourceCategoryMeta(article.source.category)?.label ??
                  article.source.category}
              </Link>
            </nav>

            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{article.source.name}</Badge>
                <span>{formatDate(article.publishedAt)}</span>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <Clock aria-hidden className="size-3.5" />
                  {article.readingTimeMinutes} min de lectura
                </span>
              </div>

              <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-balance md:text-4xl">
                {article.title}
              </h1>

              <p className="text-lg leading-8 text-pretty text-muted-foreground">
                {article.subtitle}
              </p>

              {article.author && (
                <p className="text-sm font-medium">Por {article.author}</p>
              )}
            </header>

            {article.imageUrl && (
              <figure className="my-8 overflow-hidden rounded-xl">
                <div className="relative aspect-video w-full bg-muted">
                  <Image
                    src={article.imageUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-xs text-muted-foreground">
                  Imagen de referencia (datos de demostración).
                </figcaption>
              </figure>
            )}

            {/* Lectura larga en serif (docs/design-system.md §2). */}
            <div className="space-y-5">
              {article.body.map((paragraph, index) => (
                <p key={index} className="font-serif text-lg leading-8">
                  {paragraph}
                </p>
              ))}
            </div>

            {article.keywords.length > 0 && (
              <>
                <Separator className="my-8" />
                <ul aria-label="Palabras clave" className="flex flex-wrap gap-2">
                  {article.keywords.map((keyword) => (
                    <li key={keyword}>
                      <Badge variant="secondary">{keyword}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>

          {/* Panel de análisis ideológico */}
          {/* Offset = altura del header pegajoso + un paso de respiración. */}
          <aside className="lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">
                  Análisis ideológico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Clase predicha
                  </p>
                  <IdeologyBadge
                    ideologyClass={article.ideology.predicted}
                    size="md"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {IDEOLOGY_META[article.ideology.predicted].description}
                  </p>
                  <p className="text-sm">
                    Confianza del modelo:{" "}
                    <span className="font-mono font-semibold tabular-nums">
                      {formatConfidence(article.ideology.confidence)}
                    </span>
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Distribución de probabilidad (8 clases)
                  </p>
                  <IdeologyDistribution
                    probabilities={article.ideology.probabilities}
                    predicted={article.ideology.predicted}
                  />
                </div>

                <Separator />

                <p className="text-xs leading-5 text-muted-foreground">
                  Clasificación generada automáticamente (modelo{" "}
                  <code className="font-mono">
                    {article.ideology.modelVersion}
                  </code>
                  ). La distribución suma 1 y describe el encuadre dominante
                  del texto, no la veracidad de los hechos.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
