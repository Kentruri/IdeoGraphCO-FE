import Link from "next/link";

import { SITE_DESCRIPTION, SITE_NAME, SOURCE_CATEGORY_META } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-heading text-lg font-bold">{SITE_NAME}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {SITE_DESCRIPTION}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Fuentes</p>
          <ul className="grid grid-cols-2 gap-1.5 text-sm">
            {SOURCE_CATEGORY_META.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/fuentes/${category.slug}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Sobre el proyecto</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Prototipo académico del trabajo de grado{" "}
            <em>
              Desarrollo de clasificador multiclase para identificación de
              orientación ideológica en noticias políticas colombianas
            </em>{" "}
            — Universidad del Valle.
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Los medios, autores y clasificaciones que se muestran son datos de
            demostración generados para probar la interfaz; no corresponden a
            publicaciones reales.
          </p>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
          <span>Escuela de Ingeniería de Sistemas y Computación</span>
        </div>
      </div>
    </footer>
  );
}
