import { cn } from "@/lib/utils";
import type { ClassificationExplanation } from "@/types/article";

interface IdeologyExplanationProps {
  explanation: ClassificationExplanation;
  className?: string;
}

/**
 * Por qué la noticia cae en su clase predicha, y en la segunda si pesa.
 *
 * El párrafo lo redacta un LLM leyendo el texto con el codebook de las
 * clases: el clasificador no se explica a sí mismo. Por eso el rótulo va
 * siempre visible y pegado al párrafo, nunca en un tooltip, y el LLM se
 * nombra aparte del modelo de clasificación.
 */
export function IdeologyExplanation({
  explanation,
  className,
}: IdeologyExplanationProps) {
  return (
    <section
      aria-labelledby="explicacion-clasificacion"
      className={cn("border-l border-border pl-4", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 id="explicacion-clasificacion" className="text-sm font-semibold">
          Por qué esta clasificación
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          IA · {explanation.model}
        </p>
      </div>
      <p className="mt-1.5 text-sm leading-6 text-pretty">{explanation.text}</p>
      <p className="mt-2 font-mono text-[11px] leading-5 text-muted-foreground">
        {explanation.disclaimer}
      </p>
    </section>
  );
}
