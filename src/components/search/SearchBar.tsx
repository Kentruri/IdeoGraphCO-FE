"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Término inicial (p. ej. el `q` actual en /buscar). */
  initialQuery?: string;
  placeholder?: string;
  className?: string;
  /** Se invoca tras navegar (útil para cerrar el menú móvil). */
  onNavigate?: () => void;
}

/** Caja de búsqueda: navega a /buscar?q=… al enviar. */
export function SearchBar({
  initialQuery = "",
  placeholder = "Buscar noticias…",
  className,
  onNavigate,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

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
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Buscar noticias"
        className="pl-8"
      />
    </form>
  );
}
