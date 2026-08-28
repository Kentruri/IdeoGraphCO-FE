import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { VerdictDeck } from "@/components/landing/VerdictDeck";
import { Button } from "@/components/ui/button";

/**
 * Hero de portada: declaración editorial junto a la pila de veredictos,
 * mediciones de ejemplo que se barajan en 3D con los materiales reales
 * del sistema (cinta, badge, tipografía).
 */
export function Hero() {
  return (
    <section
      aria-label="Presentación"
      className="relative flex min-h-[calc(100svh-var(--spacing-header))] items-center overflow-hidden"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-8 lg:py-10">
        <div className="max-w-2xl space-y-7">
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.98] tracking-tight text-balance motion-safe:animate-fade-up sm:text-5xl lg:text-6xl">
            El mapa ideológico de la prensa colombiana
          </h1>
          <p className="max-w-xl text-lg leading-8 text-pretty text-muted-foreground motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
            Un clasificador multiclase lee cada texto político y reparte su
            encuadre entre ocho clases en tensión.
          </p>
          <div className="flex flex-wrap items-center gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:220ms]">
            <Button asChild size="lg" className="px-5">
              <Link href="/redaccion">
                Clasificar un texto
                <ArrowRight
                  aria-hidden
                  className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:group-hover/button:translate-x-0.5"
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-5">
              <Link href="/noticias">Explorar noticias</Link>
            </Button>
          </div>
        </div>

        <VerdictDeck className="w-full motion-safe:animate-fade-up motion-safe:[animation-delay:150ms]" />
      </div>
    </section>
  );
}
