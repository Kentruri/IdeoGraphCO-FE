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
 * DTOs — contrato con la API (hoy mock, mañana IdeoGraphCO-BE).
 * Mantienen snake_case porque así los expondrá el backend.
 * ---------------------------------------------------------------------- */

export interface ArticleClassificationDTO {
  /** Clase ideológica predicha (argmax de la distribución). */
  label: IdeologyClass;
  /** Distribución softmax sobre las 8 clases; suma 1. */
  probabilities: IdeologyDistribution;
  model_version: string;
}

export interface ArticleDTO {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  source_name: string;
  source_category: SourceCategory;
  author: string | null;
  published_at: string;
  image_url: string | null;
  reading_time_minutes: number;
  classification: ArticleClassificationDTO;
}

export interface ArticleDetailDTO extends ArticleDTO {
  /** Cuerpo del artículo como lista de párrafos. */
  body: string[];
  keywords: string[];
}

export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

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

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  source: {
    name: string;
    category: SourceCategory;
  };
  author: string | null;
  publishedAt: string;
  imageUrl: string | null;
  readingTimeMinutes: number;
  ideology: ArticleIdeology;
}

export interface ArticleDetail extends Article {
  body: string[];
  keywords: string[];
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
