import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { adaptClassification } from "@/adapters/article.adapter";
import type {
  ArticleIdeology,
  ClassifyRequestDTO,
  ClassifyResponseDTO,
  ExplanationReviewCreatedDTO,
  ExplanationReviewRequestDTO,
  HealthDTO,
  NotPoliticalCategory,
  NotPoliticalErrorDTO,
} from "@/types/article";

/**
 * Clasificador del trabajo de grado para la mesa de redacción (RTK Query).
 *
 * Llama a `POST /api/v1/classify` de IdeoGraphCO-BE, que reenvía el texto al
 * servicio de inferencia y no guarda nada. Si el BE tiene GEMINI_API_KEY,
 * antes lo pasa por el filtro de politicidad de la ingesta y puede
 * rechazarlo (422 `not_political`); sin clave, clasifica todo texto. Va con su propia variable,
 * NEXT_PUBLIC_CLASSIFIER_API_URL (p. ej. `http://localhost:8000/api/v1`),
 * aparte de la del listado (NEXT_PUBLIC_API_URL), porque depende del
 * servicio de inferencia: normalmente las dos apuntan al mismo backend. Sin
 * la variable, la mesa usa el léxico de demostración
 * (`src/lib/demo-classifier.ts`).
 */
export const CLASSIFIER_API_URL =
  process.env.NEXT_PUBLIC_CLASSIFIER_API_URL ?? "";

/** Por qué la mesa no devolvió veredicto. */
export type ClassifyFailure =
  | { kind: "not_political"; category: NotPoliticalCategory; reason: string }
  | { kind: "unavailable" };

function isNotPoliticalError(data: unknown): data is NotPoliticalErrorDTO {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { code?: unknown }).code === "not_political"
  );
}

/** Lo que lanza `unwrap()` es un ClassifyFailure; cualquier otra cosa, "unavailable". */
export function toClassifyFailure(error: unknown): ClassifyFailure {
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { kind?: unknown }).kind === "not_political"
  ) {
    return error as ClassifyFailure;
  }
  return { kind: "unavailable" };
}

/** Por qué no se guardó la ficha de revisión. */
export type ReviewFailure =
  | { kind: "rejected"; message: string }
  | { kind: "disabled" }
  | { kind: "unavailable" };

/** Primer mensaje de un 422 de FastAPI (`detail` es una lista de errores). */
function firstValidationMessage(data: unknown): string {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const message = (detail[0] as { msg?: unknown }).msg;
    if (typeof message === "string") return message;
  }
  return "La ficha no cumple el formato que espera el servidor.";
}

export const classifierApi = createApi({
  reducerPath: "classifierApi",
  baseQuery: fetchBaseQuery({ baseUrl: CLASSIFIER_API_URL }),
  endpoints: (builder) => ({
    /** Qué ofrece el BE: con `desk_explanations`, la mesa muestra la explicación en vivo. */
    getHealth: builder.query<HealthDTO, void>({
      query: () => "health",
    }),
    /** Guarda la ficha de revisión de una explicación en vivo (`POST /explanation-reviews`). */
    saveExplanationReview: builder.mutation<
      ExplanationReviewCreatedDTO,
      ExplanationReviewRequestDTO
    >({
      query: (body) => ({ url: "explanation-reviews", method: "POST", body }),
      transformErrorResponse: (response: FetchBaseQueryError): ReviewFailure =>
        response.status === 422
          ? { kind: "rejected", message: firstValidationMessage(response.data) }
          : response.status === 503
            ? { kind: "disabled" }
            : { kind: "unavailable" },
    }),
    classifyText: builder.mutation<ArticleIdeology, ClassifyRequestDTO>({
      query: (body) => ({ url: "classify", method: "POST", body }),
      transformResponse: (response: ClassifyResponseDTO) =>
        adaptClassification(response),
      // El 422 de validación de FastAPI no trae `code`; solo el del filtro.
      transformErrorResponse: (response: FetchBaseQueryError): ClassifyFailure =>
        response.status === 422 && isNotPoliticalError(response.data)
          ? {
              kind: "not_political",
              category: response.data.category,
              reason: response.data.reason,
            }
          : { kind: "unavailable" },
    }),
  }),
});

export const {
  useClassifyTextMutation,
  useGetHealthQuery,
  useSaveExplanationReviewMutation,
} = classifierApi;
