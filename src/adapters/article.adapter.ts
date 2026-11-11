import type {
  Article,
  ArticleDetail,
  ArticleIdeology,
  ArticleSource,
  ClassificationDTO,
  ClassificationExplanation,
  ExplanationDTO,
  Paginated,
  PaginatedStoriesDTO,
  SourceArticleDTO,
  StoryDetailDTO,
  StoryListItemDTO,
  SynthesizedArticle,
  SynthesizedDTO,
} from "@/types/article";

/**
 * Capa de adaptación DTO → modelo de UI (mismo patrón que `adapter/` en
 * the-unbiased-journal-frontend). Si el contrato del backend cambia,
 * solo se toca este archivo.
 */

/**
 * Nombre del medio para la UI. Si falta `source_display_name` (un BE
 * anterior al campo), se muestra el slug antes que dejarlo vacío.
 */
function sourceDisplayName(
  dto: Pick<StoryListItemDTO, "source_name" | "source_display_name">
): string {
  return dto.source_display_name?.trim() || dto.source_name;
}

export function adaptClassification(dto: ClassificationDTO): ArticleIdeology {
  return {
    predicted: dto.label,
    probabilities: dto.probabilities,
    confidence: dto.probabilities[dto.label],
    modelVersion: dto.model_version,
  };
}

export function adaptArticle(dto: StoryListItemDTO): Article {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    subtitle: dto.subtitle,
    source: {
      name: sourceDisplayName(dto),
      category: dto.source_category,
    },
    author: dto.author,
    publishedAt: dto.published_at,
    imageUrl: dto.image_url,
    readingTimeMinutes: dto.reading_time_minutes,
    ideology: adaptClassification(dto.classification),
    sourcesCount: dto.sources_count,
    hasSynthesized: dto.has_synthesized,
  };
}

function adaptSource(dto: SourceArticleDTO): ArticleSource {
  return {
    id: dto.id,
    name: sourceDisplayName(dto),
    category: dto.source_category,
    title: dto.title,
    snippet: dto.snippet,
    url: dto.url,
    author: dto.author,
    publishedAt: dto.published_at,
    ideology: dto.classification
      ? adaptClassification(dto.classification)
      : null,
  };
}

function adaptSynthesized(dto: SynthesizedDTO): SynthesizedArticle {
  return {
    title: dto.title,
    body: dto.body,
    model: dto.model,
    generatedAt: dto.generated_at,
    disclaimer: dto.disclaimer,
    ideology: dto.classification
      ? adaptClassification(dto.classification)
      : null,
  };
}

function adaptExplanation(dto: ExplanationDTO): ClassificationExplanation {
  return {
    text: dto.text,
    classes: dto.classes,
    model: dto.model,
    generatedAt: dto.generated_at,
    disclaimer: dto.disclaimer,
  };
}

export function adaptArticleDetail(dto: StoryDetailDTO): ArticleDetail {
  return {
    ...adaptArticle(dto),
    keywords: dto.keywords,
    explanation: dto.explanation ? adaptExplanation(dto.explanation) : null,
    synthesized: dto.synthesized ? adaptSynthesized(dto.synthesized) : null,
    // El contrato no fija el orden de `sources`; el representativo es el
    // primero en reportar, así que el orden cronológico lo deja al frente.
    sources: dto.sources
      .map(adaptSource)
      .sort(
        (a, b) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      ),
  };
}

export function adaptPaginatedArticles(
  dto: PaginatedStoriesDTO
): Paginated<Article> {
  return {
    items: dto.items.map(adaptArticle),
    page: dto.page,
    pageSize: dto.page_size,
    totalItems: dto.total_items,
    totalPages: dto.total_pages,
  };
}
