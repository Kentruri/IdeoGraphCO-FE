import { cn } from "@/lib/utils";

interface SectionOpenProps {
  title: string;
  /** Contenido alineado a la derecha del titular (contadores, enlaces). */
  aside?: React.ReactNode;
  lede?: string;
  /** h1 cuando la sección abre su propia página. */
  as?: "h1" | "h2";
  className?: string;
}

/**
 * Apertura editorial de sección: regla doble de imprenta + titular display.
 * Es la única jerarquía de sección del sistema (sin eyebrows ni numeración).
 */
export function SectionOpen({
  title,
  aside,
  lede,
  as: Heading = "h2",
  className,
}: SectionOpenProps) {
  return (
    <header className={cn("rule-double pt-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <Heading className="font-display text-3xl font-bold tracking-tight text-balance md:text-5xl">
          {title}
        </Heading>
        {aside}
      </div>
      {lede && (
        <p className="mt-4 max-w-2xl text-base leading-7 text-pretty text-muted-foreground">
          {lede}
        </p>
      )}
    </header>
  );
}
