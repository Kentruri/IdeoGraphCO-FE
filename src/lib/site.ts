import type { SourceCategory } from "@/types/article";

export const SITE_NAME = "IdeoGraphCO";

export const SITE_DESCRIPTION =
  "Clasificación de la orientación ideológica en noticias políticas colombianas: clase predicha y distribución de probabilidad sobre ocho clases.";

export interface SourceCategoryMeta {
  slug: SourceCategory;
  label: string;
  description: string;
}

/** Categorías de fuente del corpus, en el orden del menú de navegación. */
export const SOURCE_CATEGORY_META: SourceCategoryMeta[] = [
  {
    slug: "nacional",
    label: "Nacional",
    description: "Medios de circulación nacional y grandes casas editoriales.",
  },
  {
    slug: "independiente",
    label: "Independiente",
    description: "Medios digitales independientes y periodismo investigativo.",
  },
  {
    slug: "regional",
    label: "Regional",
    description: "Prensa de las regiones y coberturas territoriales.",
  },
  {
    slug: "institucional",
    label: "Institucional",
    description: "Comunicaciones oficiales de entidades del Estado.",
  },
  {
    slug: "judicial",
    label: "Judicial",
    description: "Cubrimiento de altas cortes, procesos y justicia.",
  },
  {
    slug: "opinion",
    label: "Opinión",
    description: "Columnas, análisis y centros de pensamiento.",
  },
  {
    slug: "gremial",
    label: "Gremial",
    description: "Medios de gremios y sectores económicos organizados.",
  },
];

export function getSourceCategoryMeta(
  slug: string
): SourceCategoryMeta | undefined {
  return SOURCE_CATEGORY_META.find((category) => category.slug === slug);
}
