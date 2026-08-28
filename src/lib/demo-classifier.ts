import {
  IDEOLOGY_CLASSES,
  type IdeologyClass,
  type IdeologyDistribution,
} from "@/types/ideology";

/**
 * Clasificador de DEMOSTRACIÓN para la mesa de redacción de la portada.
 * Corre en el navegador con un léxico ilustrativo por clase; no es el
 * modelo del trabajo de grado (la UI lo declara junto a cada veredicto).
 * Es capa de presentación: no toca Redux, adapters ni tipos.
 */

const LEXICON: Record<IdeologyClass, string[]> = {
  personalismo: [
    "lider",
    "caudillo",
    "carisma",
    "figura",
    "su liderazgo",
    "el presidente decidio",
    "un solo hombre",
    "personalista",
    "su voluntad",
  ],
  institucionalismo: [
    "instituciones",
    "corte",
    "procedimiento",
    "separacion de poderes",
    "estado de derecho",
    "constitucion",
    "tramite",
    "legalidad",
    "competencias",
    "control judicial",
  ],
  populismo: [
    "el pueblo",
    "elites",
    "la gente",
    "los de arriba",
    "casta",
    "voluntad popular",
    "establecimiento",
    "clamor",
    "los poderosos",
  ],
  doctrinarismo: [
    "programa",
    "doctrina",
    "ideario",
    "partido",
    "coherencia",
    "estatutos",
    "linea del partido",
    "militancia",
    "conviccion ideologica",
  ],
  soberanismo: [
    "soberania",
    "injerencia",
    "autonomia",
    "extranjero",
    "patria",
    "nacional",
    "independencia economica",
    "intereses externos",
  ],
  globalismo: [
    "multilateral",
    "internacional",
    "libre comercio",
    "integracion",
    "tratado",
    "cooperacion",
    "apertura",
    "ocde",
    "onu",
    "estandares internacionales",
  ],
  conservadurismo: [
    "tradicion",
    "valores",
    "familia",
    "orden",
    "seguridad",
    "religion",
    "moral",
    "costumbres",
    "herencia",
  ],
  progresismo: [
    "derechos",
    "diversidad",
    "genero",
    "inclusion",
    "cambio social",
    "minorias",
    "ambiental",
    "igualdad",
    "feminista",
  ],
};

export interface DemoSignal {
  ideologyClass: IdeologyClass;
  term: string;
  count: number;
}

export interface DemoVerdict {
  distribution: IdeologyDistribution;
  predicted: IdeologyClass;
  confidence: number;
  signals: DemoSignal[];
  /** false si el texto no activó ningún término del léxico. */
  hasSignals: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export function classifyDemoText(text: string): DemoVerdict {
  const normalized = normalize(text);
  const signals: DemoSignal[] = [];
  const scores = {} as Record<IdeologyClass, number>;

  for (const ideologyClass of IDEOLOGY_CLASSES) {
    let score = 0;
    for (const term of LEXICON[ideologyClass]) {
      const count = countOccurrences(normalized, term);
      if (count > 0) {
        signals.push({ ideologyClass, term, count });
        score += count;
      }
    }
    scores[ideologyClass] = score;
  }

  const hasSignals = signals.length > 0;

  /* Softmax con suavizado: sin señales queda casi uniforme; con señales,
     la temperatura mantiene distribuciones legibles (no 0/1). */
  const exponentials = IDEOLOGY_CLASSES.map((ideologyClass) =>
    Math.exp(scores[ideologyClass] / 1.6)
  );
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  const distribution = {} as IdeologyDistribution;
  IDEOLOGY_CLASSES.forEach((ideologyClass, index) => {
    distribution[ideologyClass] = exponentials[index] / total;
  });

  const predicted = IDEOLOGY_CLASSES.reduce((best, ideologyClass) =>
    distribution[ideologyClass] > distribution[best] ? ideologyClass : best
  );

  signals.sort((a, b) => b.count - a.count);

  return {
    distribution,
    predicted,
    confidence: distribution[predicted],
    signals: signals.slice(0, 6),
    hasSignals,
  };
}
