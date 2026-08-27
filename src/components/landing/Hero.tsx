import Link from "next/link";
import { ArrowDown } from "lucide-react";

import { IdeoGraphCanvas } from "@/components/landing/IdeoGraphCanvas";
import { Button } from "@/components/ui/button";

/**
 * Hero de portada: declaración editorial a la izquierda sobre el grafo
 * generativo de las 8 clases a pantalla completa. Asimétrico por diseño
 * (VARIANCE 7): el vacío de la derecha es del grafo.
 */
export function Hero() {
  return (
    <section
      aria-label="Presentación"
      className="relative flex min-h-[calc(100svh-var(--spacing-header))] items-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <IdeoGraphCanvas />
        {/* Velo funcional de legibilidad sobre la zona de texto. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-background from-20% via-background/70 via-45% to-transparent to-70% max-md:bg-linear-to-t max-md:from-background max-md:from-30% max-md:via-background/60 max-md:to-transparent"
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-3xl space-y-7">
          <h1 className="font-display text-[2.65rem] font-extrabold uppercase leading-[0.98] tracking-tight text-balance motion-safe:animate-fade-up sm:text-6xl lg:text-7xl">
            El mapa ideológico de la prensa colombiana
          </h1>
          <p className="max-w-xl text-lg leading-8 text-pretty text-muted-foreground motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
            Un clasificador multiclase lee cada noticia política y reparte su
            encuadre entre ocho clases ideológicas en tensión.
          </p>
          <div className="flex flex-wrap items-center gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:220ms]">
            <Button asChild size="lg" className="px-5">
              <Link href="#portada">
                Explorar noticias
                <ArrowDown
                  aria-hidden
                  className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:group-hover/button:translate-y-0.5"
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-5">
              <Link href="#metodo">Cómo se mide</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
