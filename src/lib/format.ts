const LOCALE = "es-CO";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: "auto",
});

/** "12 de julio de 2026" */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

/** "hace 3 horas" / "ayer" para fechas recientes; fecha absoluta en el resto. */
export function formatPublishedAt(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = date.getTime() - Date.now();
  const diffHours = Math.round(diffMs / 3_600_000);

  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffMs / 86_400_000);
  if (Math.abs(diffDays) < 7) {
    return relativeFormatter.format(diffDays, "day");
  }
  return dateFormatter.format(date);
}

/** 0.4231 → "42,3 %" */
export function formatProbability(value: number): string {
  return `${(value * 100).toLocaleString(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
}

/** 0.4231 → "42 %" (para badges compactos). */
export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)} %`;
}

/** Fin de frase: punto, interrogación o exclamación, con su cierre de comillas o paréntesis. */
const SENTENCE_END = /[.!?][»”")]?(?=\s)/g;
/**
 * Palabra antes del punto que puede ser una abreviatura: corta y con mayúscula
 * («Sr.», «Dr.», «Cali.» se pierde, pero es preferible a cortar mal) o con un
 * punto interno («EE.UU.», «p.m.»).
 */
const ABBREVIATION = /(?:^|\s)(?:[A-ZÁÉÍÓÚÑ][\p{L}]{0,3}|[\p{L}.]*\.[\p{L}]+)$/u;
/** Lo que puede abrir la frase siguiente; tras un punto seguido de minúscula no hay fin de frase. */
const SENTENCE_START = /[A-ZÁÉÍÓÚÑ¿¡«"“0-9]/;

/**
 * El fragmento público de una nota (CONTRACT.md regla 1) se corta a 320
 * caracteres y termina en «…», a veces a mitad de frase. Esto lo recorta
 * hasta su última frase completa, siempre que conserve al menos `minRatio` del
 * texto; si no, lo deja como está, con sus puntos suspensivos.
 */
export function endAtLastSentence(text: string, minRatio = 0.45): string {
  const trimmed = text.trimEnd();
  if (!trimmed.endsWith("…")) return trimmed;

  let cut = -1;
  for (const match of trimmed.matchAll(SENTENCE_END)) {
    const index = match.index ?? 0;
    const end = index + match[0].length;
    if (ABBREVIATION.test(trimmed.slice(0, index))) continue;
    const next = trimmed.slice(end).trimStart().charAt(0);
    if (next && !SENTENCE_START.test(next)) continue;
    cut = end;
  }
  return cut >= trimmed.length * minRatio ? trimmed.slice(0, cut) : trimmed;
}
