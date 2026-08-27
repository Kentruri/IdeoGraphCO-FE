import { Reveal } from "@/components/motion/Reveal";
import { SectionOpen } from "@/components/landing/SectionOpen";
import { IDEOLOGY_META, OPPOSITE_PAIRS } from "@/types/ideology";

/**
 * Los 4 pares opuestos del anteproyecto como filas tipográficas enfrentadas
 * sobre un eje hairline (firma del mundo §5.4). Las descripciones van en
 * texto visible: la explicación central del producto no se esconde en hovers.
 */
export function TensionAxes() {
  return (
    <section
      id="clases"
      aria-label="Las ocho clases ideológicas"
      className="mx-auto w-full max-w-7xl scroll-mt-header px-4 py-24 sm:px-6 md:py-32"
    >
      <SectionOpen
        title="Ocho clases, cuatro tensiones"
        lede="Cada eje enfrenta dos encuadres opuestos. Toda noticia recibe una probabilidad en las ocho clases; ninguna medición juzga la veracidad de los hechos."
      />

      <div className="mt-14 space-y-14 md:mt-20 md:space-y-16">
        {OPPOSITE_PAIRS.map(([left, right], index) => {
          const leftMeta = IDEOLOGY_META[left];
          const rightMeta = IDEOLOGY_META[right];
          return (
            <Reveal key={left} delay={index * 0.06}>
              <div className="group grid items-start gap-4 md:grid-cols-[1fr_minmax(4rem,9rem)_1fr] md:gap-8">
                <div className="space-y-2 md:text-right">
                  <h3
                    className="font-display text-3xl font-bold tracking-tight transition-colors duration-200 ease-out-expo md:text-4xl md:group-hover:text-(--pair-color) lg:text-5xl"
                    style={
                      { "--pair-color": leftMeta.cssVar } as React.CSSProperties
                    }
                  >
                    {leftMeta.label}
                  </h3>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground md:ml-auto">
                    {leftMeta.description}
                  </p>
                </div>

                {/* Eje: hairline con los dos colores semánticos en los extremos. */}
                <div
                  aria-hidden
                  className="flex items-center gap-1.5 md:mt-5"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: leftMeta.cssVar }}
                  />
                  <span className="h-px w-full min-w-8 flex-1 bg-border" />
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: rightMeta.cssVar }}
                  />
                </div>

                <div className="space-y-2">
                  <h3
                    className="font-display text-3xl font-bold tracking-tight transition-colors duration-200 ease-out-expo md:text-4xl md:group-hover:text-(--pair-color) lg:text-5xl"
                    style={
                      { "--pair-color": rightMeta.cssVar } as React.CSSProperties
                    }
                  >
                    {rightMeta.label}
                  </h3>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    {rightMeta.description}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
