import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  adaptArticleDetail,
  adaptPaginatedArticles,
} from "@/adapters/article.adapter";
import type {
  Article,
  ArticleDetail,
  ArticleListParams,
  Paginated,
  PaginatedStoriesDTO,
  StoryDetailDTO,
} from "@/types/article";

/**
 * Cliente de la API de noticias de IdeoGraphCO-BE (RTK Query, contrato v2:
 * `GET /stories` y `GET /stories/{slug}`).
 *
 * NEXT_PUBLIC_API_URL es la raíz versionada del backend (p. ej.
 * `https://api.ideographco.dev/api/v1`); sin ella se usa el backend local
 * de desarrollo (`uvicorn src.api.app:app --port 8000`). Los DTOs y el
 * adapter son el contrato compartido.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const articlesApi = createApi({
  reducerPath: "articlesApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ["Articles", "ArticleDetail"],
  endpoints: (builder) => ({
    getArticles: builder.query<Paginated<Article>, ArticleListParams>({
      query: ({ page = 1, pageSize = 9, sourceCategory, q } = {}) => ({
        url: "stories",
        params: {
          page,
          page_size: pageSize,
          ...(sourceCategory ? { source_category: sourceCategory } : {}),
          ...(q ? { q } : {}),
        },
      }),
      transformResponse: (response: PaginatedStoriesDTO) =>
        adaptPaginatedArticles(response),
      providesTags: ["Articles"],
    }),
    getArticleBySlug: builder.query<ArticleDetail, string>({
      query: (slug) => `stories/${encodeURIComponent(slug)}`,
      transformResponse: (response: StoryDetailDTO) =>
        adaptArticleDetail(response),
      providesTags: (_result, _error, slug) => [
        { type: "ArticleDetail", id: slug },
      ],
    }),
  }),
});

export const { useGetArticlesQuery, useGetArticleBySlugQuery } = articlesApi;
