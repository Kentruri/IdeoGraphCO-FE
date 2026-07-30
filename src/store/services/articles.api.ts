import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  adaptArticleDetail,
  adaptPaginatedArticles,
} from "@/adapters/article.adapter";
import type {
  Article,
  ArticleDetail,
  ArticleDetailDTO,
  ArticleDTO,
  ArticleListParams,
  Paginated,
  PaginatedDTO,
} from "@/types/article";

/**
 * Cliente de la API de noticias (RTK Query).
 *
 * Hoy apunta a las rutas mock de `src/app/api`. Cuando IdeoGraphCO-BE
 * esté disponible, basta con definir NEXT_PUBLIC_API_URL: los DTOs y el
 * adapter son el contrato compartido.
 */
export const articlesApi = createApi({
  reducerPath: "articlesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  }),
  tagTypes: ["Articles", "ArticleDetail"],
  endpoints: (builder) => ({
    getArticles: builder.query<Paginated<Article>, ArticleListParams>({
      query: ({ page = 1, pageSize = 9, sourceCategory, q } = {}) => ({
        url: "articles",
        params: {
          page,
          page_size: pageSize,
          ...(sourceCategory ? { source_category: sourceCategory } : {}),
          ...(q ? { q } : {}),
        },
      }),
      transformResponse: (response: PaginatedDTO<ArticleDTO>) =>
        adaptPaginatedArticles(response),
      providesTags: ["Articles"],
    }),
    getArticleBySlug: builder.query<ArticleDetail, string>({
      query: (slug) => `articles/${slug}`,
      transformResponse: (response: ArticleDetailDTO) =>
        adaptArticleDetail(response),
      providesTags: (_result, _error, slug) => [
        { type: "ArticleDetail", id: slug },
      ],
    }),
  }),
});

export const { useGetArticlesQuery, useGetArticleBySlugQuery } = articlesApi;
