import type {
  Article,
  ArticleClassificationDTO,
  ArticleDTO,
  ArticleDetail,
  ArticleDetailDTO,
  ArticleIdeology,
  Paginated,
  PaginatedDTO,
} from "@/types/article";

/**
 * Capa de adaptación DTO → modelo de UI (mismo patrón que `adapter/` en
 * the-unbiased-journal-frontend). Si el contrato del backend cambia,
 * solo se toca este archivo.
 */

export function adaptClassification(
  dto: ArticleClassificationDTO
): ArticleIdeology {
  return {
    predicted: dto.label,
    probabilities: dto.probabilities,
    confidence: dto.probabilities[dto.label],
    modelVersion: dto.model_version,
  };
}

export function adaptArticle(dto: ArticleDTO): Article {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    subtitle: dto.subtitle,
    source: {
      name: dto.source_name,
      category: dto.source_category,
    },
    author: dto.author,
    publishedAt: dto.published_at,
    imageUrl: dto.image_url,
    readingTimeMinutes: dto.reading_time_minutes,
    ideology: adaptClassification(dto.classification),
  };
}

export function adaptArticleDetail(dto: ArticleDetailDTO): ArticleDetail {
  return {
    ...adaptArticle(dto),
    body: dto.body,
    keywords: dto.keywords,
  };
}

export function adaptPaginatedArticles(
  dto: PaginatedDTO<ArticleDTO>
): Paginated<Article> {
  return {
    items: dto.items.map(adaptArticle),
    page: dto.page,
    pageSize: dto.page_size,
    totalItems: dto.total_items,
    totalPages: dto.total_pages,
  };
}
