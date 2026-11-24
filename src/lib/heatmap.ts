import type { IdeologyClass } from "@/types/ideology";

/**
 * Ejes del mapa de calor en sentido horario desde arriba (o desde el fondo,
 * en 3D). Cada clase queda enfrentada a su opuesta (OPPOSITE_PAIRS):
 * personalismo/doctrinarismo, globalismo/soberanismo y los otros dos pares
 * en diagonal.
 */
export const HEATMAP_AXES: readonly IdeologyClass[] = [
  "personalismo",
  "institucionalismo",
  "globalismo",
  "conservadurismo",
  "doctrinarismo",
  "populismo",
  "soberanismo",
  "progresismo",
];

export const AXIS_COUNT = HEATMAP_AXES.length;
/** Ángulo entre ejes consecutivos (radianes). */
export const AXIS_STEP = (2 * Math.PI) / AXIS_COUNT;

/**
 * Intensidad del calor en [0, 1]: raíz cuadrada de la probabilidad, para que
 * las clases pequeñas sigan a la vista sin exagerar las grandes. El radio
 * (2D), la altura (3D) y el color usan esta misma escala.
 */
export function heatLevel(probability: number): number {
  return Math.sqrt(Math.min(1, Math.max(0, probability)));
}

/** Paradas de la rampa de calor en nivel de calor (ver .heat-ramp). */
export const HEAT_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, "--heat-0"],
  [0.3, "--heat-1"],
  [0.5, "--heat-2"],
  [0.71, "--heat-3"],
  [1, "--heat-4"],
];

/** Marcas de la leyenda (probabilidad, texto). */
export const LEGEND_TICKS: ReadonlyArray<readonly [number, string]> = [
  [0, "0"],
  [0.05, "5"],
  [0.125, "12,5"],
  [0.25, "25"],
  [0.5, "50"],
  [1, "100 %"],
];

/** Niveles de las isotermas (probabilidad). 12,5 % = reparto uniforme. */
export const ISO_LEVELS = [0.05, 0.125, 0.25, 0.5] as const;

export const RANK_ORDINALS = [
  "1.ª",
  "2.ª",
  "3.ª",
  "4.ª",
  "5.ª",
  "6.ª",
  "7.ª",
  "8.ª",
];

/** Curva de salida del sistema (--ease-out-expo). */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Curva de desplazamiento en pantalla (--ease-in-out-strong). */
export const EASE_IN_OUT: [number, number, number, number] = [
  0.77, 0, 0.175, 1,
];
