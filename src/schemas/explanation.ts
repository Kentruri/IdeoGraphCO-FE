import { z } from "zod";

import { IDEOLOGY_CLASSES, type IdeologyClass } from "@/types/ideology";

/**
 * Validación en el cliente de lo que redacta la IA (Zod).
 *
 * El BE ya valida la salida del modelo antes de mandarla (esquema JSON en
 * `claude -p --json-schema` y las reglas de `parse_explanation`). Aquí se
 * vuelve a validar al llegar, por dos motivos: el FE no muestra como final un
 * texto que no cumpla el contrato aunque el servidor falle o cambie, y las
 * reglas que el jurado vería romper (la palabra «confianza», porcentajes, una
 * clase que no es la del veredicto) quedan cubiertas en los dos lados.
 *
 * Contrato: `POST /api/v1/explain` y `POST /api/v1/explanation-reviews` en el
 * CONTRACT.md de IdeoGraphCO-BE.
 */

export const ideologyClassSchema = z.enum(IDEOLOGY_CLASSES);

export const SUPPORT_LEVELS = ["alto", "medio", "bajo"] as const;
export const supportLevelSchema = z.enum(SUPPORT_LEVELS);
export type SupportLevel = z.infer<typeof supportLevelSchema>;

/** Margen de suma de la distribución (el BE redondea a 4 decimales). */
const DISTRIBUTION_TOLERANCE = 0.01;

/** Las 8 clases, cada una entre 0 y 1, sumando 1. */
const distributionSchema = z
  .record(ideologyClassSchema, z.number().min(0).max(1))
  .refine(
    (distribution) =>
      Math.abs(
        Object.values(distribution).reduce((total, value) => total + value, 0) - 1
      ) <= DISTRIBUTION_TOLERANCE,
    { message: "La distribución no suma 1." }
  );

/* -------------------------------------------------------------------------
 * Texto de la explicación: mismas cotas que `src/explanation/generator.py`
 * ---------------------------------------------------------------------- */

export const EXPLANATION_MIN_WORDS = 40;
export const EXPLANATION_MAX_WORDS = 125;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const explanationTextSchema = z
  .string()
  .trim()
  .refine(
    (text) => {
      const words = countWords(text);
      return words >= EXPLANATION_MIN_WORDS && words <= EXPLANATION_MAX_WORDS;
    },
    {
      message: `El párrafo debe tener entre ${EXPLANATION_MIN_WORDS} y ${EXPLANATION_MAX_WORDS} palabras.`,
    }
  )
  // La probabilidad del modelo no es una confianza (sin calibrar), y la
  // interfaz ya muestra las cifras: el párrafo no repite ninguna de las dos.
  .refine((text) => !/\bconfianza\b/i.test(text), {
    message: "El párrafo usa la palabra «confianza».",
  })
  .refine((text) => !/\d\s*%/.test(text), {
    message: "El párrafo escribe porcentajes.",
  });

/** Clases que explica: la predicha y, si pesa, la segunda, sin repetir. */
const explainedClassesSchema = z
  .array(ideologyClassSchema)
  .min(1)
  .max(2)
  .refine((classes) => new Set(classes).size === classes.length, {
    message: "La explicación repite una clase.",
  });

/* -------------------------------------------------------------------------
 * Eventos de `POST /api/v1/explain` (text/event-stream)
 * ---------------------------------------------------------------------- */

export const classificationEventSchema = z.object({
  label: ideologyClassSchema,
  probabilities: distributionSchema,
  model_version: z.string().min(1),
  political_filter: z.enum(["disabled", "passed", "unavailable"]),
});
export type ClassificationEvent = z.infer<typeof classificationEventSchema>;

export const statusEventSchema = z.object({
  phase: z.enum(["thinking", "writing"]),
});

export const deltaEventSchema = z.object({ text: z.string() });

export const retryEventSchema = z.object({ reason: z.string().min(1) });

export const EXPLAIN_ERROR_CODES = [
  "busy",
  "not_political",
  "classifier_unavailable",
  "explainer_unavailable",
  "explanation_failed",
] as const;

export const errorEventSchema = z.object({
  code: z.enum(EXPLAIN_ERROR_CODES),
  detail: z.string(),
  category: z.string().nullish(),
  reason: z.string().nullish(),
});
export type ErrorEvent = z.infer<typeof errorEventSchema>;

/** Evento `explanation`: la salida estructurada final del modelo. */
export const liveExplanationSchema = z
  .object({
    text: explanationTextSchema,
    classes: explainedClassesSchema,
    /** Lectura de la IA sobre cuánto apoya el texto cada clase explicada. */
    support: z.partialRecord(ideologyClassSchema, supportLevelSchema),
    model: z.string().min(1),
    prompt_version: z.string().min(1),
    disclaimer: z.string().min(1),
  })
  .superRefine((explanation, ctx) => {
    const rated = Object.keys(explanation.support).sort().join();
    if (rated !== [...explanation.classes].sort().join()) {
      ctx.addIssue({
        code: "custom",
        path: ["support"],
        message: "El apoyo no califica exactamente las clases explicadas.",
      });
    }
  });
export type LiveExplanation = z.infer<typeof liveExplanationSchema>;

/**
 * La explicación final solo vale para el veredicto que explica: su primera
 * clase tiene que ser la predicha por el modelo en ese mismo stream.
 */
export function liveExplanationFor(predicted: IdeologyClass) {
  return liveExplanationSchema.refine(
    (explanation) => explanation.classes[0] === predicted,
    {
      path: ["classes"],
      message: "La explicación no corresponde a la clase predicha.",
    }
  );
}

/* -------------------------------------------------------------------------
 * Explicación guardada (detalle de una noticia, `ExplanationDTO`)
 * ---------------------------------------------------------------------- */

export const storedExplanationSchema = z.object({
  text: explanationTextSchema,
  classes: explainedClassesSchema,
  model: z.string().min(1),
  /** null en las explicaciones escritas antes de guardar la versión. */
  prompt_version: z.string().min(1).nullish(),
  generated_at: z.iso.datetime({ offset: true }),
  disclaimer: z.string().min(1),
});

/* -------------------------------------------------------------------------
 * Ficha de revisión (formulario de la mesa)
 * ---------------------------------------------------------------------- */

export const REVIEW_TEXT_MAX_CHARS = 2000;
export const REVIEW_NOTES_MAX_CHARS = 500;

export const FITS_TEXT_OPTIONS = ["si", "en_parte", "no"] as const;
export const NEUTRAL_OPTIONS = ["si", "no"] as const;

/** Lo que el formulario guarda en su estado, antes de validar. */
export interface ReviewFormValues {
  support: Partial<Record<IdeologyClass, SupportLevel>>;
  revisedText: string;
  fitsText: string;
  neutral: string;
  notes: string;
}

/** Esquema de la ficha para las clases que explica la IA (todas calificadas). */
export function reviewFormSchemaFor(classes: readonly IdeologyClass[]) {
  return z
    .object({
      support: z.partialRecord(ideologyClassSchema, supportLevelSchema),
      revisedText: z
        .string()
        .trim()
        .min(1, "Escriba la explicación o deje la que propuso la IA.")
        .max(
          REVIEW_TEXT_MAX_CHARS,
          `Máximo ${REVIEW_TEXT_MAX_CHARS.toLocaleString("es-CO")} caracteres.`
        ),
      fitsText: z.enum(FITS_TEXT_OPTIONS, {
        error: "Elija si la explicación se ajusta al texto.",
      }),
      neutral: z.enum(NEUTRAL_OPTIONS, {
        error: "Elija si el lenguaje es neutral.",
      }),
      notes: z
        .string()
        .trim()
        .max(REVIEW_NOTES_MAX_CHARS, `Máximo ${REVIEW_NOTES_MAX_CHARS} caracteres.`),
    })
    .superRefine((values, ctx) => {
      for (const ideologyClass of classes) {
        if (!values.support[ideologyClass]) {
          ctx.addIssue({
            code: "custom",
            path: ["support", ideologyClass],
            message: "Elija el nivel de apoyo.",
          });
        }
      }
    });
}
export type ReviewForm = z.infer<ReturnType<typeof reviewFormSchemaFor>>;
