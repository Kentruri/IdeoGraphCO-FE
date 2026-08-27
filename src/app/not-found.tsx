import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <p aria-hidden className="font-heading text-7xl font-bold tracking-tight">
        404
      </p>
      <h1 className="font-heading text-xl font-semibold">
        Página no encontrada
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        La noticia o sección que buscas no existe o fue movida.
      </p>
      <Button asChild>
        <Link href="/">Volver a la portada</Link>
      </Button>
    </div>
  );
}
