import { SourceItem } from "@/components/articles/SourceItem";
import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ArticleSource, SynthesizedArticle } from "@/types/article";
import { IDEOLOGY_META, type IdeologyClass } from "@/types/ideology";

/** Capitular editorial, la misma de la lectura principal. */
const DROP_CAP =
  "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-extrabold first-letter:leading-[0.85]";

/** «A», «A y B», «A, B y C». */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/** Clase más repetida entre las fuentes clasificadas. */
function predominantClass(sources: ArticleSource[]) {
  const counts = new Map<IdeologyClass, number>();
  for (const source of sources) {
    if (!source.ideology) continue;
    const label = source.ideology.predicted;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  let best: { label: IdeologyClass; count: number } | null = null;
  for (const [label, count] of counts) {
    if (!best || count > best.count) best = { label, count };
  }
  return best ? { ...best, total: [...counts.values()].reduce((a, b) => a + b, 0) } : null;
}

interface TriangulatedStoryProps {
  synthesized: SynthesizedArticle;
  /** Fuentes en orden cronológico; la primera es la noticia clasificada. */
  sources: ArticleSource[];
}

/**
 * Versión triangulada: el mismo hecho contado con lo que publicaron varios
 * medios, en un texto sintético redactado para leerse con un encuadre más
 * neutral. Va después de la noticia original (la clasificada) y de su mapa,
 * nunca en su lugar, y cierra con el libro de fuentes: cada medio con su
 * propia clasificación y, como renglón de total, cómo lee el mismo modelo
 * la versión triangulada.
 */
export function TriangulatedStory({ synthesized, sources }: TriangulatedStoryProps) {
  const lead = sources[0];
  const names = joinNames(sources.map((source) => source.name));
  const predominant = predominantClass(sources);
  const reading = synthesized.ideology;

  return (
    <section
      id="version-triangulada"
      aria-labelledby="version-triangulada-titulo"
      className="rule-double mt-16 scroll-mt-header pt-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="version-triangulada-titulo"
          className="font-display text-2xl font-bold tracking-tight"
        >
          Versión triangulada
        </h2>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {sources.length} medios · {synthesized.model}
        </p>
      </div>
      <p className="mt-1.5 max-w-prose text-sm leading-6 text-muted-foreground">
        El mismo hecho, contado con lo que publicaron {names}, en un texto
        redactado para leerse con un encuadre más neutral. La noticia que se
        clasificó es la original de {lead?.name}; esta versión no la
        reemplaza.
      </p>

      {/* El pliego sintético: otra superficie, porque es otra procedencia. */}
      <article
        aria-labelledby="sintetica-titulo"
        className="mt-8 bg-card px-6 pb-7 pt-6 ring-1 ring-border sm:px-9 sm:pb-9 sm:pt-8"
      >
        <h3
          id="sintetica-titulo"
          className="max-w-prose font-serif text-2xl font-semibold leading-tight text-balance md:text-3xl"
        >
          {synthesized.title}
        </h3>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Texto sintético redactado por IA ({synthesized.model}) ·{" "}
          <time dateTime={synthesized.generatedAt}>
            {formatDate(synthesized.generatedAt)}
          </time>
        </p>
        <div className="mt-7 max-w-prose space-y-5">
          {synthesized.body.map((paragraph, index) => (
            <p
              key={index}
              className={cn(
                "font-serif text-[1.0625rem] leading-8 text-pretty",
                index === 0 && DROP_CAP
              )}
            >
              {paragraph}
            </p>
          ))}
        </div>
        <p className="mt-8 max-w-prose border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
          {synthesized.disclaimer}
        </p>
      </article>

      {/* Libro de fuentes: cada medio y, como total, la versión triangulada. */}
      <div className="mt-12">
        <h3 className="font-display text-xl font-bold tracking-tight">
          Las fuentes y su encuadre
        </h3>
        <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
          Cada medio con su propia clasificación y, al final, cómo lee el
          mismo modelo la versión triangulada.
        </p>
        <ol className="mt-2 divide-y divide-border">
          {sources.map((source, index) => (
            <SourceItem
              key={source.id}
              source={source}
              showSnippet={index > 0}
              note={index === 0 ? "noticia clasificada" : undefined}
            />
          ))}
        </ol>

        {reading && (
          <div className="border-t-2 border-foreground/70 pt-5">
            <p className="font-mono text-xs text-muted-foreground">
              Versión triangulada · mismo modelo ({reading.modelVersion})
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <IdeologyBadge
                ideologyClass={reading.predicted}
                confidence={reading.confidence}
              />
              <IdeologyStrip
                probabilities={reading.probabilities}
                className="w-40"
              />
            </div>
            {predominant && (
              <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
                {reading.predicted === predominant.label ? "Coincide" : "Difiere"}{" "}
                con la clase predominante entre las fuentes (
                {IDEOLOGY_META[predominant.label].label},{" "}
                <span className="tabular-nums">
                  {predominant.count} de {predominant.total}
                </span>
                ). La distribución describe el encuadre del texto, no la
                veracidad de los hechos.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
