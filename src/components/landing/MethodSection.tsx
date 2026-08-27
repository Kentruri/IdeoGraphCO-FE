import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyDistribution } from "@/components/ideology/IdeologyDistribution";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { SectionOpen } from "@/components/landing/SectionOpen";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { IdeologyDistribution as Distribution } from "@/types/ideology";

/** Distribución ilustrativa (suma 1). Etiquetada como ejemplo en la ficha. */
const EXAMPLE_DISTRIBUTION: Distribution = {
  soberanismo: 0.31,
  conservadurismo: 0.22,
  institucionalismo: 0.14,
  doctrinarismo: 0.11,
  personalismo: 0.08,
  populismo: 0.07,
  globalismo: 0.04,
  progresismo: 0.03,
};

const STEPS = [
  {
    term: "Corpus",
    body: "Noticias políticas colombianas de siete categorías de fuente, normalizadas antes del análisis.",
  },
  {
    term: "Clasificador",
    body: "Un modelo multiclase entrenado en el trabajo de grado lee el texto completo de cada pieza.",
  },
  {
    term: "Distribución",
    body: "La salida softmax reparte el encuadre entre las ocho clases; la mayor es la clase predicha.",
  },
];

/**
 * El método en tres términos escalonados sobre una espina hairline, junto a
 * una ficha de medición real de ejemplo (reutiliza los componentes de
 * ideología del producto: aquí no hay maquetas falsas).
 */
export function MethodSection() {
  return (
    <section
      id="metodo"
      aria-label="Cómo se mide"
      className="mx-auto w-full max-w-7xl scroll-mt-header px-4 py-24 sm:px-6 md:py-32"
    >
      <SectionOpen title="Cómo se mide" />

      <div className="mt-14 grid gap-14 md:mt-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <dl className="space-y-12 border-l border-border pl-6 sm:pl-8">
            {STEPS.map((step, index) => (
              <Reveal key={step.term} delay={index * 0.08}>
                {/* Cascada escalonada solo desde sm (colapso móvil explícito). */}
                <div
                  className={cn(
                    "max-w-md",
                    index === 1 && "sm:ml-10",
                    index === 2 && "sm:ml-20"
                  )}
                >
                  <dt className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                    {step.term}
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.body}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>

        <Reveal className="lg:col-span-6" delay={0.12}>
          <figure className="border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <IdeologyBadge ideologyClass="soberanismo" size="md" />
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                confianza 31 %
              </p>
            </div>
            <IdeologyStrip
              probabilities={EXAMPLE_DISTRIBUTION}
              className="my-6 h-2"
            />
            <IdeologyDistribution
              probabilities={EXAMPLE_DISTRIBUTION}
              predicted="soberanismo"
            />
            <figcaption className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              Ejemplo ilustrativo. La distribución suma 1 y describe el
              encuadre dominante del texto, no la veracidad de los hechos.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
