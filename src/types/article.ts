import type { IdeologyClass, IdeologyDistribution } from "@/types/ideology";

/** Categorías de fuente del corpus (ver `src/scraper/sources.py` en IdeoGraphCO). */
export const SOURCE_CATEGORIES = [
  "nacional",
  "independiente",
  "regional",
  "institucional",
  "judicial",
  "opinion",
  "gremial",
] as const;

export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

/* -------------------------------------------------------------------------
 * DTOs — contrato v2 con IdeoGraphCO-BE (`src/schemas/dto.py`, explicado en
 * su CONTRACT.md). Mantienen snake_case porque así viajan por la API.
 *
 * La unidad que se lista es la *story*: agrupa 1..5 artículos de medios
 * distintos sobre la misma historia. Los campos de la story (título, medio,
 * clasificación…) son los de su artículo representativo, el primero en
 * reportar.
 * ---------------------------------------------------------------------- */

/** Clasificación ideológica de un artículo (`ClassificationDTO`). */
export interface ClassificationDTO {
  /** Clase ideológica predicha (argmax de la distribución). */
  label: IdeologyClass;
  /** Distribución softmax sobre las 8 clases; suma 1. */
  probabilities: IdeologyDistribution;
  model_version: string;
}

/** Cuerpo de `POST /api/v1/classify` (mesa de redacción; el BE no lo guarda). */
export interface ClassifyRequestDTO {
  title: string;
  text: string;
}

/** Item de `GET /api/v1/stories` (`StoryListItemDTO`). */
export interface StoryListItemDTO {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source_name: string;
  source_category: SourceCategory;
  author: string | null;
  published_at: string;
  image_url: string | null;
  reading_time_minutes: number;
  /** Del representativo; nunca null en el listado. */
  classification: ClassificationDTO;
  sources_count: number;
  has_synthesized: boolean;
}

/**
 * Artículo de un medio dentro de la story (`SourceArticleDTO`). El público
 * ve título, snippet y enlace al original, nunca el cuerpo completo.
 */
export interface SourceArticleDTO {
  id: string;
  source_name: string;
  source_category: SourceCategory;
  title: string;
  /** Primeros ~300 caracteres del artículo. */
  snippet: string;
  url: string;
  author: string | null;
  published_at: string;
  /** null mientras la clasificación de esta fuente está pendiente. */
  classification: ClassificationDTO | null;
}

/** Noticia sintetizada por IA a partir de ≥3 fuentes (`SynthesizedDTO`). */
export interface SynthesizedDTO {
  title: string;
  body: string[];
  model: string;
  generated_at: string;
  disclaimer: string;
}

/** Respuesta de `GET /api/v1/stories/{slug}` (`StoryDetailDTO`). */
export interface StoryDetailDTO extends StoryListItemDTO {
  keywords: string[];
  synthesized: SynthesizedDTO | null;
  /** Siempre ≥1, cada fuente con su propia clasificación. */
  sources: SourceArticleDTO[];
}

export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

/** Respuesta de `GET /api/v1/stories` (`PaginatedStoriesDTO`). */
export type PaginatedStoriesDTO = PaginatedDTO<StoryListItemDTO>;

/* -------------------------------------------------------------------------
 * Modelos de UI — lo que consumen los componentes (camelCase).
 * La conversión DTO → modelo vive en `src/adapters/article.adapter.ts`.
 * ---------------------------------------------------------------------- */

export interface ArticleIdeology {
  predicted: IdeologyClass;
  probabilities: IdeologyDistribution;
  /** Probabilidad de la clase predicha, en [0, 1]. */
  confidence: number;
  modelVersion: string;
}

/** Noticia del listado: una story vista desde su artículo representativo. */
export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: {
    name: string;
    category: SourceCategory;
  };
  author: string | null;
  publishedAt: string;
  imageUrl: string | null;
  readingTimeMinutes: number;
  ideology: ArticleIdeology;
  /** Número de medios que cubren la historia. */
  sourcesCount: number;
  hasSynthesized: boolean;
}

/** Cobertura de un medio dentro de la noticia. */
export interface ArticleSource {
  id: string;
  name: string;
  category: SourceCategory;
  title: string;
  snippet: string;
  url: string;
  author: string | null;
  publishedAt: string;
  /** null mientras la clasificación está pendiente. */
  ideology: ArticleIdeology | null;
}

/** Síntesis generada por IA; se muestra siempre con su `disclaimer`. */
export interface SynthesizedArticle {
  title: string;
  body: string[];
  model: string;
  generatedAt: string;
  disclaimer: string;
}

export interface ArticleDetail extends Article {
  keywords: string[];
  synthesized: SynthesizedArticle | null;
  /** De la primera fuente en reportar (el representativo) a la última. */
  sources: ArticleSource[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Parámetros de listado que acepta la API. */
export interface ArticleListParams {
  page?: number;
  pageSize?: number;
  sourceCategory?: SourceCategory;
  q?: string;
}
