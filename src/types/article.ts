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

/**
 * Respuesta 200 de `POST /api/v1/classify` (`ClassifyResponseDTO`). El filtro
 * de politicidad del BE es opcional: `disabled` sin GEMINI_API_KEY (se confía
 * en el usuario), `passed` si confirmó que es una noticia política colombiana,
 * `unavailable` si falló y se clasificó sin él. La mesa no lo muestra.
 */
export interface ClassifyResponseDTO extends ClassificationDTO {
  political_filter: "disabled" | "passed" | "unavailable";
}

/** Categoría del filtro de politicidad cuando el texto no es del dominio. */
export type NotPoliticalCategory =
  | "nonpolitical_article"
  | "biography_static"
  | "garbage";

/** 422 de `POST /api/v1/classify`: el filtro rechazó el texto (`NotPoliticalErrorDTO`). */
export interface NotPoliticalErrorDTO {
  detail: string;
  code: "not_political";
  category: NotPoliticalCategory;
  confidence: number | null;
  /** Motivo en ≤ 12 palabras, escrito por el filtro. */
  reason: string;
}

/** Item de `GET /api/v1/stories` (`StoryListItemDTO`). */
export interface StoryListItemDTO {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  /** Slug del medio en el catálogo del BE (`lasillavacia`). */
  source_name: string;
  /** Nombre del medio para mostrar (`La Silla Vacía`). */
  source_display_name: string;
  source_category: SourceCategory;
  author: string | null;
  /** ISO 8601 en UTC con zona (`2026-07-30T12:21:00Z`). */
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
  source_display_name: string;
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

/** Noticia sintética por triangulación de ≥3 medios (`SynthesizedDTO`). */
export interface SynthesizedDTO {
  title: string;
  body: string[];
  model: string;
  generated_at: string;
  disclaimer: string;
  /** Encuadre de la síntesis según el mismo clasificador (opcional). */
  classification?: ClassificationDTO | null;
}

/**
 * Por qué la noticia cae en su clase predicha, y en la segunda si llega al
 * 20 % (`ExplanationDTO`). La redacta un LLM a partir del texto y del codebook;
 * no es el razonamiento del clasificador, por eso trae su `disclaimer`.
 */
export interface ExplanationDTO {
  /** Párrafo de 3 o 4 frases. */
  text: string;
  /** Clases que explica: la predicha y, si pesa, la segunda. */
  classes: IdeologyClass[];
  /** LLM que la redactó. */
  model: string;
  generated_at: string;
  disclaimer: string;
}

/** Respuesta de `GET /api/v1/stories/{slug}` (`StoryDetailDTO`). */
export interface StoryDetailDTO extends StoryListItemDTO {
  keywords: string[];
  /**
   * Explicación de `classification`; null si no se ha generado o si la
   * noticia se reclasificó después. Ausente en un BE anterior al campo.
   */
  explanation?: ExplanationDTO | null;
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
    /** Nombre legible del medio (`source_display_name`). */
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
  /** Nombre legible del medio (`source_display_name`). */
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

/**
 * Versión triangulada: texto sintético redactado por IA a partir de los
 * medios de la historia. Se muestra siempre con su `disclaimer` y después
 * de la noticia original, que es la que se clasificó.
 */
export interface SynthesizedArticle {
  title: string;
  body: string[];
  model: string;
  generatedAt: string;
  disclaimer: string;
  /** Cómo lee el clasificador la versión triangulada (null si no se pudo). */
  ideology: ArticleIdeology | null;
}

/**
 * Explicación de la clase predicha, redactada por IA a partir del texto y del
 * codebook. Se muestra bajo la clase y siempre con su `disclaimer`.
 */
export interface ClassificationExplanation {
  text: string;
  classes: IdeologyClass[];
  model: string;
  generatedAt: string;
  disclaimer: string;
}

export interface ArticleDetail extends Article {
  keywords: string[];
  /** null mientras no exista para la clasificación vigente. */
  explanation: ClassificationExplanation | null;
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

/**
 * Parámetros de listado que acepta la API (`GET /stories`). Los filtros se
 * aplican en el servidor y se combinan con Y; `totalItems`/`totalPages`
 * cuentan lo filtrado.
 */
export interface ArticleListParams {
  page?: number;
  /** 1 a 50 (MAX_PAGE_SIZE del BE). */
  pageSize?: number;
  sourceCategory?: SourceCategory;
  /** Clase predicha del representativo; basta con que coincida una. */
  ideologies?: IdeologyClass[];
  /**
   * Límites inclusivos sobre `published_at`: un instante ISO 8601
   * (`2026-07-01T05:00:00.000Z`) o una fecha `YYYY-MM-DD`, que el BE toma
   * como día UTC. Para días locales se envían los instantes de la medianoche.
   */
  publishedFrom?: string;
  publishedTo?: string;
  q?: string;
}
