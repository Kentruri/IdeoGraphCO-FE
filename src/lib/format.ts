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
