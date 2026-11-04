import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { adaptClassification } from "@/adapters/article.adapter";
import type {
  ArticleIdeology,
  ClassificationDTO,
  ClassifyRequestDTO,
} from "@/types/article";

/**
 * Clasificador del trabajo de grado para la mesa de redacción (RTK Query).
 *
 * Llama a `POST /api/v1/classify` de IdeoGraphCO-BE, que reenvía el texto
 * al servicio de inferencia y no guarda nada. Va con su propia variable,
 * NEXT_PUBLIC_CLASSIFIER_API_URL (p. ej. `http://localhost:8000/api/v1`),
 * aparte de la del listado (NEXT_PUBLIC_API_URL), porque depende del
 * servicio de inferencia: normalmente las dos apuntan al mismo backend. Sin
 * la variable, la mesa usa el léxico de demostración
 * (`src/lib/demo-classifier.ts`).
 */
export const CLASSIFIER_API_URL =
  process.env.NEXT_PUBLIC_CLASSIFIER_API_URL ?? "";

export const classifierApi = createApi({
  reducerPath: "classifierApi",
  baseQuery: fetchBaseQuery({ baseUrl: CLASSIFIER_API_URL }),
  endpoints: (builder) => ({
    classifyText: builder.mutation<ArticleIdeology, ClassifyRequestDTO>({
      query: (body) => ({ url: "classify", method: "POST", body }),
      transformResponse: (response: ClassificationDTO) =>
        adaptClassification(response),
    }),
  }),
});

export const { useClassifyTextMutation } = classifierApi;
