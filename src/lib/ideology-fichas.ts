import { OPPOSITE_PAIRS, type IdeologyClass } from "@/types/ideology";

/**
 * Contenido de presentación de las fichas de hemeroteca (punto de vista
 * neutral: describen encuadres periodísticos, no juzgan posiciones).
 * Es capa de UI: los tipos y metadatos canónicos siguen en types/ideology.
 */

/** Orden de las puntas de la rosa: cada clase enfrenta a su opuesta (i ↔ i+4). */
export const ROSE_ORDER: readonly IdeologyClass[] = [
  OPPOSITE_PAIRS[0][0], // personalismo (N)
  OPPOSITE_PAIRS[1][0], // populismo (NE)
  OPPOSITE_PAIRS[2][0], // soberanismo (E)
  OPPOSITE_PAIRS[3][0], // conservadurismo (SE)
  OPPOSITE_PAIRS[0][1], // institucionalismo (S)
  OPPOSITE_PAIRS[1][1], // doctrinarismo (SO)
  OPPOSITE_PAIRS[2][1], // globalismo (O)
  OPPOSITE_PAIRS[3][1], // progresismo (NO)
];

export const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
] as const;

export interface IdeologyFichaContent {
  /** Ampliación de la descripción corta de IDEOLOGY_META. */
  definition: string;
  /** Frases ilustrativas del encuadre (redacción de ejemplo, no citas reales). */
  examples: string[];
}

export function fichaNumeral(ideologyClass: IdeologyClass): string {
  return ROMAN_NUMERALS[ROSE_ORDER.indexOf(ideologyClass)];
}

export function oppositeOf(ideologyClass: IdeologyClass): IdeologyClass {
  const pair = OPPOSITE_PAIRS.find((p) => p.includes(ideologyClass));
  if (!pair) return ideologyClass;
  return pair[0] === ideologyClass ? pair[1] : pair[0];
}

export const IDEOLOGY_FICHAS: Record<IdeologyClass, IdeologyFichaContent> = {
  personalismo: {
    definition:
      "El relato gira alrededor de una figura: sus decisiones, su carácter y su voluntad explican los hechos. Partidos, programas e instituciones aparecen como telón de fondo del líder.",
    examples: [
      "«Solo su liderazgo puede sacar adelante la reforma.»",
      "«El presidente, contra todos, volvió a imponer su ritmo.»",
      "«La suerte del gobierno se juega en el carisma de un solo hombre.»",
    ],
  },
  institucionalismo: {
    definition:
      "El peso del relato está en los procedimientos: competencias, controles, términos legales y separación de poderes. Los actores importan menos que las reglas que los limitan.",
    examples: [
      "«La Corte fijó los límites: el decreto deberá ajustarse a la ley.»",
      "«El trámite seguirá su curso en las comisiones constitucionales.»",
      "«Las instituciones, no los nombres, resolverán el pulso.»",
    ],
  },
  populismo: {
    definition:
      "El conflicto central es pueblo contra élites: la voluntad popular como fuente directa de legitimidad frente a un establecimiento que la bloquea.",
    examples: [
      "«La gente en las calles ya decidió, aunque los de arriba no escuchen.»",
      "«Las élites vuelven a cerrar filas contra el mandato popular.»",
      "«El clamor del pueblo no cabe en los despachos.»",
    ],
  },
  doctrinarismo: {
    definition:
      "La argumentación se apoya en programa y doctrina: coherencia ideológica, líneas de partido y fidelidad a un ideario por encima de coyunturas y personas.",
    examples: [
      "«La bancada votará según el ideario aprobado en la convención.»",
      "«El programa es claro y no se negocia por encuestas.»",
      "«Más que un candidato, está en juego una doctrina económica.»",
    ],
  },
  soberanismo: {
    definition:
      "La clave del encuadre es la autonomía nacional: decisiones propias frente a presiones, capitales o organismos externos; lo nacional como valor a defender.",
    examples: [
      "«Ninguna banca extranjera dictará la política agraria.»",
      "«La soberanía energética no se subasta.»",
      "«El país debe decidir sin tutelas de afuera.»",
    ],
  },
  globalismo: {
    definition:
      "El marco es la integración: multilateralismo, tratados, comercio y estándares internacionales como camino de progreso y como vara para medir al país.",
    examples: [
      "«El acuerdo alinea al país con los estándares de la OCDE.»",
      "«Aislarse del comercio global costaría empleos.»",
      "«La cooperación internacional es la salida a la crisis.»",
    ],
  },
  conservadurismo: {
    definition:
      "El encuadre defiende continuidad sociocultural: tradición, familia, orden y valores heredados como bienes a proteger frente al cambio acelerado.",
    examples: [
      "«La reforma amenaza valores que han sostenido a la sociedad.»",
      "«El orden y las costumbres no son negociables.»",
      "«La familia vuelve a ser la primera trinchera.»",
    ],
  },
  progresismo: {
    definition:
      "El encuadre empuja cambio sociocultural: ampliación de derechos, diversidad, igualdad de género y agenda ambiental como medida del avance social.",
    examples: [
      "«El fallo amplía derechos que la sociedad ya reclamaba.»",
      "«La diversidad deja de ser la excepción en el gabinete.»",
      "«Sin justicia ambiental no hay desarrollo posible.»",
    ],
  },
};
