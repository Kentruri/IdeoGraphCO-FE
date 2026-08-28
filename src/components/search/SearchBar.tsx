"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Término inicial (p. ej. el `q` actual en /buscar). */
  initialQuery?: string;
  placeholder?: string;
  className?: string;
  /** "hero" = variante grande de la página de búsqueda. */
  size?: "default" | "hero";
  /** Se invoca tras navegar (útil para cerrar el menú móvil). */
  onNavigate?: () => void;
}

/**
 * Caja de búsqueda subrayada (voz de imprenta, no de formulario):
 * navega a /buscar?q=… al enviar. Enter y el botón de flecha envían.
 */
export function SearchBar({
  initialQuery = "",
  placeholder = "Buscar noticias…",
  className,
  size = "default",
  onNavigate,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const hero = size === "hero";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
    onNavigate?.();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative", className)}
    >
      <Search
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          hero ? "left-0 size-5" : "left-1.5 size-4"
        )}
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Buscar noticias"
        className={cn(
          "rounded-none border-0 border-b border-input bg-transparent shadow-none transition-colors duration-150 ease-out-expo focus-visible:border-foreground focus-visible:ring-0 dark:bg-transparent",
          hero
            ? "h-14 pl-8 pr-12 font-display text-xl font-semibold md:h-16 md:text-2xl"
            : "pl-7 pr-9"
        )}
      />
      {/* Affordance de envío visible; Enter sigue funcionando. */}
      <Button
        type="submit"
        variant="ghost"
        size={hero ? "icon" : "icon-sm"}
        aria-label="Buscar"
        disabled={!query.trim()}
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-none"
      >
        <ArrowRight
          className={cn(
            "motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:group-hover/button:translate-x-0.5",
            hero ? "size-5" : "size-4"
          )}
        />
      </Button>
    </form>
  );
}
