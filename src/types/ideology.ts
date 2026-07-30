/**
 * Fuente única de verdad de las 8 clases ideológicas.
 * Debe mantenerse alineada con `src.core.schema.IDEOLOGY_CLASSES`
 * del pipeline de ML (IdeoGraphCO).
 */
export const IDEOLOGY_CLASSES = [
  "personalismo",
  "institucionalismo",
  "populismo",
  "doctrinarismo",
  "soberanismo",
  "globalismo",
  "conservadurismo",
  "progresismo",
] as const;

export type IdeologyClass = (typeof IDEOLOGY_CLASSES)[number];

/** Distribución de probabilidad softmax: 8 floats que suman 1. */
export type IdeologyDistribution = Record<IdeologyClass, number>;

/** Pares opuestos declarados en el anteproyecto (4 ejes teóricos). */
export const OPPOSITE_PAIRS: ReadonlyArray<
  readonly [IdeologyClass, IdeologyClass]
> = [
  ["personalismo", "institucionalismo"],
  ["populismo", "doctrinarismo"],
  ["soberanismo", "globalismo"],
  ["conservadurismo", "progresismo"],
];

export interface IdeologyMeta {
  /** Etiqueta legible en español. */
  label: string;
  /** Descripción corta para tooltips y leyendas. */
  description: string;
  /** Variable CSS con el color del tema (cambia entre claro/oscuro). */
  cssVar: string;
}

export const IDEOLOGY_META: Record<IdeologyClass, IdeologyMeta> = {
  personalismo: {
    label: "Personalismo",
    description:
      "Encuadre centrado en la figura del líder por encima de partidos e instituciones.",
    cssVar: "var(--ideology-personalismo)",
  },
  institucionalismo: {
    label: "Institucionalismo",
    description:
      "Énfasis en la separación de poderes, los procedimientos y el respeto a las instituciones.",
    cssVar: "var(--ideology-institucionalismo)",
  },
  populismo: {
    label: "Populismo",
    description:
      "Retórica de pueblo contra élites y centralidad de la voluntad popular.",
    cssVar: "var(--ideology-populismo)",
  },
  doctrinarismo: {
    label: "Doctrinarismo",
    description:
      "Argumentación basada en programas, doctrina de partido y coherencia ideológica.",
    cssVar: "var(--ideology-doctrinarismo)",
  },
  soberanismo: {
    label: "Soberanismo",
    description:
      "Defensa de la autonomía nacional frente a actores e intereses externos.",
    cssVar: "var(--ideology-soberanismo)",
  },
  globalismo: {
    label: "Globalismo",
    description:
      "Apertura al multilateralismo, la integración internacional y el libre comercio.",
    cssVar: "var(--ideology-globalismo)",
  },
  conservadurismo: {
    label: "Conservadurismo",
    description:
      "Defensa de valores tradicionales, orden y continuidad en lo sociocultural.",
    cssVar: "var(--ideology-conservadurismo)",
  },
  progresismo: {
    label: "Progresismo",
    description:
      "Impulso a derechos civiles, diversidad y cambio social en lo sociocultural.",
    cssVar: "var(--ideology-progresismo)",
  },
};

/**
 * Orden de despliegue para segmentos/franjas adyacentes (strips apilados).
 * Es el orden validado de la paleta frente a daltonismo: los pares de
 * colores contiguos superan los umbrales de separación CVD en ambos temas.
 * No reordenar sin re-validar la paleta.
 */
export const IDEOLOGY_DISPLAY_ORDER: readonly IdeologyClass[] = [
  "conservadurismo",
  "populismo",
  "doctrinarismo",
  "soberanismo",
  "globalismo",
  "institucionalismo",
  "progresismo",
  "personalismo",
];
