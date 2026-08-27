import Link from "next/link";

import { Button } from "@/components/ui/button";
import { IDEOLOGY_DISPLAY_ORDER, IDEOLOGY_META } from "@/types/ideology";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 py-28 text-center sm:px-6">
      <p
        aria-hidden
        className="text-stroke select-none font-display text-[7rem] font-extrabold leading-none tracking-tight motion-safe:animate-fade-up md:font-stretch-expanded md:text-[12rem]"
      >
        404
      </p>
      <div
        aria-hidden
        className="flex items-center gap-1.5 motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]"
      >
        {IDEOLOGY_DISPLAY_ORDER.map((ideologyClass, index) => (
          <span
            key={ideologyClass}
            className="size-2 rounded-full opacity-60"
            style={{
              backgroundColor: IDEOLOGY_META[ideologyClass].cssVar,
              transform: `translateY(${index % 2 === 0 ? -3 : 3}px)`,
            }}
          />
        ))}
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight motion-safe:animate-fade-up motion-safe:[animation-delay:140ms]">
        Página no encontrada
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground motion-safe:animate-fade-up motion-safe:[animation-delay:200ms]">
        La noticia o sección que buscas no existe o fue movida.
      </p>
      <Button
        asChild
        className="motion-safe:animate-fade-up motion-safe:[animation-delay:260ms]"
      >
        <Link href="/">Volver a la portada</Link>
      </Button>
    </div>
  );
}
