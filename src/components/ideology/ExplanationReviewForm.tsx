"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FITS_TEXT_OPTIONS,
  NEUTRAL_OPTIONS,
  REVIEW_NOTES_MAX_CHARS,
  REVIEW_TEXT_MAX_CHARS,
  SUPPORT_LEVELS,
  reviewFormSchemaFor,
  type ClassificationEvent,
  type LiveExplanation,
  type ReviewFormValues,
  type SupportLevel,
} from "@/schemas/explanation";
import type { ExplanationRequest } from "@/hooks/useExplanationStream";
import {
  useSaveExplanationReviewMutation,
  type ReviewFailure,
} from "@/store/services/classifier.api";
import type { ExplanationReviewRequestDTO } from "@/types/article";
import { IDEOLOGY_META, type IdeologyClass } from "@/types/ideology";

interface ExplanationReviewFormProps {
  request: ExplanationRequest;
  classification: ClassificationEvent;
  explanation: LiveExplanation;
  className?: string;
}

const SUPPORT_LABEL: Record<SupportLevel, string> = {
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};
const FITS_LABEL: Record<(typeof FITS_TEXT_OPTIONS)[number], string> = {
  si: "Sí",
  en_parte: "En parte",
  no: "No",
};
const NEUTRAL_LABEL: Record<(typeof NEUTRAL_OPTIONS)[number], string> = {
  si: "Sí",
  no: "No",
};

const FIELD_CLASS =
  "w-full border border-border bg-card px-3 py-2 font-mono text-sm leading-6 shadow-none outline-none transition-colors duration-150 ease-out-expo placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive";

type Errors = Partial<Record<string, string>>;

function failureMessage(failure: ReviewFailure): string {
  switch (failure.kind) {
    case "rejected":
      return `El servidor rechazó la ficha: ${failure.message}`;
    case "disabled":
      return "Las fichas de revisión no están activas en este servidor.";
    default:
      return "No se pudo guardar la ficha. Intente de nuevo.";
  }
}

function toFailure(error: unknown): ReviewFailure {
  const kind = (error as { kind?: unknown } | null)?.kind;
  return kind === "rejected" || kind === "disabled"
    ? (error as ReviewFailure)
    : { kind: "unavailable" };
}

/**
 * Ficha de revisión de la explicación en vivo. Llega prellenada con la salida
 * estructurada del modelo (el apoyo que la IA le da a cada clase y su
 * párrafo); quien revisa la corrige, dice si se ajusta al texto y si el
 * lenguaje es neutral, y la guarda. Se valida con Zod antes de enviarla y el
 * servidor la vuelve a validar.
 */
export function ExplanationReviewForm({
  request,
  classification,
  explanation,
  className,
}: ExplanationReviewFormProps) {
  const id = useId();
  const classes = explanation.classes;
  const [values, setValues] = useState<ReviewFormValues>(() => ({
    support: { ...explanation.support },
    revisedText: explanation.text,
    fitsText: "",
    neutral: "",
    notes: "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<ReviewFailure | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveReview, { isLoading }] = useSaveExplanationReviewMutation();
  const confirmation = useRef<HTMLDivElement>(null);

  // La confirmación es más baja que la ficha: sin esto, la página se acorta y
  // la vista salta al pie. El foco la deja en pantalla y la anuncia.
  useEffect(() => {
    if (saved) confirmation.current?.focus();
  }, [saved]);

  const fieldId = (name: string) => `${id}-${name}`;
  const errorId = (name: string) => `${id}-${name}-error`;

  function update<K extends keyof ReviewFormValues>(key: K, value: ReviewFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function updateSupport(ideologyClass: IdeologyClass, level: SupportLevel) {
    setValues((current) => ({
      ...current,
      support: { ...current.support, [ideologyClass]: level },
    }));
    setErrors((current) => ({ ...current, [`support.${ideologyClass}`]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);
    const parsed = reviewFormSchemaFor(classes).safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        next[key] ??= issue.message;
      }
      setErrors(next);
      // Lleva el foco al primer campo con error.
      const first = parsed.error.issues[0]?.path.join(".");
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }

    const form = parsed.data;
    const body: ExplanationReviewRequestDTO = {
      title: request.title,
      text: request.text,
      classification: {
        label: classification.label,
        probabilities: classification.probabilities,
        model_version: classification.model_version,
      },
      explanation: {
        text: explanation.text,
        classes: explanation.classes,
        support: explanation.support,
        model: explanation.model,
        prompt_version: explanation.prompt_version,
      },
      review: {
        support: form.support,
        revised_text: form.revisedText === explanation.text ? null : form.revisedText,
        fits_text: form.fitsText,
        neutral: form.neutral === "si",
        notes: form.notes || null,
      },
    };
    try {
      const created = await saveReview(body).unwrap();
      setSaved(created.id);
    } catch (error) {
      setFailure(toFailure(error));
    }
  }

  if (saved) {
    return (
      <div
        ref={confirmation}
        tabIndex={-1}
        role="status"
        className={cn(
          "scroll-mt-header border border-border bg-background px-4 py-3 outline-none",
          className
        )}
      >
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Check aria-hidden className="size-4" />
          Ficha guardada
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          n.º {saved.slice(0, 8)}
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby={fieldId("titulo")}
      className={cn("space-y-5 border border-border bg-background p-4", className)}
    >
      <div>
        <h5 id={fieldId("titulo")} className="text-sm font-semibold">
          Ficha de revisión
        </h5>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          La IA la llenó con su propia lectura del texto. Corríjala si no está de acuerdo
          y guárdela.
        </p>
      </div>

      {failure && (
        <p role="alert" className="border-l-2 border-destructive pl-3 text-xs leading-5">
          {failureMessage(failure)}
        </p>
      )}

      {classes.map((ideologyClass) => {
        const name = `support.${ideologyClass}`;
        const fromAi = explanation.support[ideologyClass];
        return (
          <fieldset key={ideologyClass} aria-describedby={errors[name] ? errorId(name) : undefined}>
            <legend className="flex items-center gap-2 text-xs font-medium">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: IDEOLOGY_META[ideologyClass].cssVar }}
              />
              Apoyo del texto a {IDEOLOGY_META[ideologyClass].label.toLowerCase()}
            </legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUPPORT_LEVELS.map((level, index) => (
                <ChoiceChip
                  key={level}
                  id={index === 0 ? fieldId(name) : undefined}
                  name={fieldId(name)}
                  value={level}
                  checked={values.support[ideologyClass] === level}
                  onChange={() => updateSupport(ideologyClass, level)}
                  label={SUPPORT_LABEL[level]}
                  note={level === fromAi ? "IA" : undefined}
                />
              ))}
            </div>
            <FieldError id={errorId(name)} message={errors[name]} />
          </fieldset>
        );
      })}
      <p className="-mt-2 text-[11px] leading-4 text-muted-foreground">
        El apoyo es la lectura de la IA que redactó la explicación, no una medida de
        acierto del clasificador.
      </p>

      <div>
        <label htmlFor={fieldId("revisedText")} className="text-xs font-medium">
          Explicación
        </label>
        <textarea
          id={fieldId("revisedText")}
          value={values.revisedText}
          onChange={(event) =>
            update("revisedText", event.target.value.slice(0, REVIEW_TEXT_MAX_CHARS))
          }
          rows={6}
          aria-invalid={errors.revisedText ? true : undefined}
          aria-describedby={errors.revisedText ? errorId("revisedText") : undefined}
          className={cn(FIELD_CLASS, "mt-2 resize-y")}
        />
        <FieldError id={errorId("revisedText")} message={errors.revisedText} />
      </div>

      <RadioGroup
        name="fitsText"
        legend="¿La explicación se ajusta al texto?"
        options={FITS_TEXT_OPTIONS.map((value) => ({ value, label: FITS_LABEL[value] }))}
        value={values.fitsText}
        onChange={(value) => update("fitsText", value)}
        error={errors.fitsText}
        fieldId={fieldId}
        errorId={errorId}
      />

      <RadioGroup
        name="neutral"
        legend="¿El lenguaje es neutral?"
        options={NEUTRAL_OPTIONS.map((value) => ({ value, label: NEUTRAL_LABEL[value] }))}
        value={values.neutral}
        onChange={(value) => update("neutral", value)}
        error={errors.neutral}
        fieldId={fieldId}
        errorId={errorId}
      />

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={fieldId("notes")} className="text-xs font-medium">
            Notas (opcional)
          </label>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {values.notes.length}/{REVIEW_NOTES_MAX_CHARS}
          </span>
        </div>
        <textarea
          id={fieldId("notes")}
          value={values.notes}
          onChange={(event) => update("notes", event.target.value)}
          rows={2}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? errorId("notes") : undefined}
          className={cn(FIELD_CLASS, "mt-2 resize-y")}
        />
        <FieldError id={errorId("notes")} message={errors.notes} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="max-w-xs text-[11px] leading-4 text-muted-foreground">
          Al guardar la ficha se guardan el titular, el texto, la clasificación y la
          explicación en la base de datos del prototipo.
        </p>
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "Guardando" : "Guardar ficha"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs leading-5 text-destructive">
      {message}
    </p>
  );
}

function ChoiceChip({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  note,
}: {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  note?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 border border-border px-3 py-1.5 font-mono text-xs transition-colors duration-150 ease-out-expo hover:border-foreground has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
      {note && (
        <span className="border border-current px-1 text-[10px] leading-4 opacity-80">
          {note}
        </span>
      )}
    </label>
  );
}

function RadioGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  fieldId,
  errorId,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  value: string;
  onChange: (value: T) => void;
  error?: string;
  fieldId: (name: string) => string;
  errorId: (name: string) => string;
}) {
  return (
    <fieldset aria-describedby={error ? errorId(name) : undefined}>
      <legend className="text-xs font-medium">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option, index) => (
          <ChoiceChip
            key={option.value}
            id={index === 0 ? fieldId(name) : undefined}
            name={fieldId(name)}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={option.label}
          />
        ))}
      </div>
      <FieldError id={errorId(name)} message={error} />
    </fieldset>
  );
}
