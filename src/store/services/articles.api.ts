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
      query: ({
        page = 1,
        pageSize = 9,
        sourceCategory,
        ideologies = [],
        publishedFrom,
        publishedTo,
        q,
      } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(pageSize),
        });
        if (sourceCategory) params.set("source_category", sourceCategory);
        // Una clave por clase (?ideology=a&ideology=b): `params` como objeto
        // uniría el arreglo con comas.
        for (const ideology of ideologies) params.append("ideology", ideology);
        if (publishedFrom) params.set("published_from", publishedFrom);
        if (publishedTo) params.set("published_to", publishedTo);
        if (q) params.set("q", q);
        return `stories?${params.toString()}`;
      },
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
