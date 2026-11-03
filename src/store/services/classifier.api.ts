import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { adaptClassification } from "@/adapters/article.adapter";
import type {
  ArticleClassificationDTO,
  ArticleIdeology,
  ClassifyRequestDTO,
} from "@/types/article";

/**
 * Clasificador del trabajo de grado para la mesa de redacción (RTK Query).
 *
 * Llama a `POST /api/v1/classify` de IdeoGraphCO-BE, que reenvía el texto
 * al servicio de inferencia y no guarda nada. Va con su propia variable,
 * NEXT_PUBLIC_CLASSIFIER_API_URL (p. ej. `http://localhost:8000/api/v1`),
 * porque el listado de noticias todavía usa las rutas mock: cuando migre al
 * contrato v2, las dos pueden apuntar al mismo backend. Sin la variable, la
 * mesa usa el léxico de demostración (`src/lib/demo-classifier.ts`).
 */
export const CLASSIFIER_API_URL =
  process.env.NEXT_PUBLIC_CLASSIFIER_API_URL ?? "";

export const classifierApi = createApi({
  reducerPath: "classifierApi",
  baseQuery: fetchBaseQuery({ baseUrl: CLASSIFIER_API_URL }),
  endpoints: (builder) => ({
    classifyText: builder.mutation<ArticleIdeology, ClassifyRequestDTO>({
      query: (body) => ({ url: "classify", method: "POST", body }),
      transformResponse: (response: ArticleClassificationDTO) =>
        adaptClassification(response),
    }),
  }),
});

export const { useClassifyTextMutation } = classifierApi;
