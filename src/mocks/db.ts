import { MOCK_ARTICLES } from "@/mocks/articles.mock";
import type {
  ArticleDTO,
  ArticleDetailDTO,
  PaginatedDTO,
  SourceCategory,
} from "@/types/article";

/**
 * "Base de datos" en memoria que imita el comportamiento que tendrá
 * IdeoGraphCO-BE: listado paginado con filtros y detalle por slug.
 * Cuando exista la API real, este módulo y las rutas de `app/api`
 * desaparecen sin tocar el resto del frontend.
 */

const SIMULATED_LATENCY_MS = 400;

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

/** Quita tildes y pasa a minúsculas para búsquedas tolerantes. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toListItem(article: ArticleDetailDTO): ArticleDTO {
  const { body: _body, keywords: _keywords, ...listItem } = article;
  return listItem;
}

export interface ArticleQuery {
  page: number;
  pageSize: number;
  sourceCategory?: SourceCategory;
  q?: string;
}

export async function queryArticles(
  query: ArticleQuery
): Promise<PaginatedDTO<ArticleDTO>> {
  await simulateLatency();

  let results = [...MOCK_ARTICLES].sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  if (query.sourceCategory) {
    results = results.filter(
      (article) => article.source_category === query.sourceCategory
    );
  }

  if (query.q?.trim()) {
    const needle = normalize(query.q.trim());
    results = results.filter((article) =>
      [
        article.title,
        article.subtitle,
        article.source_name,
        ...article.keywords,
      ].some((field) => normalize(field).includes(needle))
    );
  }

  const totalItems = results.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    items: results.slice(start, start + query.pageSize).map(toListItem),
    page,
    page_size: query.pageSize,
    total_items: totalItems,
    total_pages: totalPages,
  };
}

export async function findArticleBySlug(
  slug: string
): Promise<ArticleDetailDTO | undefined> {
  await simulateLatency();
  return MOCK_ARTICLES.find((article) => article.slug === slug);
}
