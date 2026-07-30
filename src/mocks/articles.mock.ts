import type { ArticleDetailDTO } from "@/types/article";
import {
  IDEOLOGY_CLASSES,
  type IdeologyClass,
  type IdeologyDistribution,
} from "@/types/ideology";

const MODEL_VERSION = "mock-0.1.0";

/**
 * Construye una distribución softmax de mentira: recibe las clases con masa
 * explícita y reparte el resto de forma uniforme para que la suma sea 1.
 * Redondea a 4 decimales y ajusta el residuo en la clase dominante.
 */
function makeDistribution(
  weights: Partial<Record<IdeologyClass, number>>
): IdeologyDistribution {
  const explicitMass = Object.values(weights).reduce(
    (sum, value) => sum + value,
    0
  );
  const remainingClasses = IDEOLOGY_CLASSES.filter(
    (ideologyClass) => weights[ideologyClass] === undefined
  );
  const uniformShare =
    remainingClasses.length > 0
      ? (1 - explicitMass) / remainingClasses.length
      : 0;

  const distribution = Object.fromEntries(
    IDEOLOGY_CLASSES.map((ideologyClass) => [
      ideologyClass,
      Number((weights[ideologyClass] ?? uniformShare).toFixed(4)),
    ])
  ) as IdeologyDistribution;

  const total = IDEOLOGY_CLASSES.reduce(
    (sum, ideologyClass) => sum + distribution[ideologyClass],
    0
  );
  const dominant = IDEOLOGY_CLASSES.reduce((best, current) =>
    distribution[current] > distribution[best] ? current : best
  );
  distribution[dominant] = Number(
    (distribution[dominant] + (1 - total)).toFixed(4)
  );

  return distribution;
}

interface MockArticleInput {
  slug: string;
  title: string;
  subtitle: string;
  sourceName: string;
  sourceCategory: ArticleDetailDTO["source_category"];
  author: string | null;
  publishedAt: string;
  readingTimeMinutes: number;
  keywords: string[];
  label: IdeologyClass;
  weights: Partial<Record<IdeologyClass, number>>;
  body: string[];
}

function buildArticle(input: MockArticleInput, index: number): ArticleDetailDTO {
  return {
    id: `mock-${String(index + 1).padStart(3, "0")}`,
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle,
    source_name: input.sourceName,
    source_category: input.sourceCategory,
    author: input.author,
    published_at: input.publishedAt,
    image_url: `https://picsum.photos/seed/${input.slug}/1200/675`,
    reading_time_minutes: input.readingTimeMinutes,
    keywords: input.keywords,
    classification: {
      label: input.label,
      probabilities: makeDistribution(input.weights),
      model_version: MODEL_VERSION,
    },
    body: input.body,
  };
}

/**
 * Dataset de demostración. Medios, autores y hechos son FICTICIOS:
 * existen solo para probar la interfaz mientras llega IdeoGraphCO-BE.
 */
const MOCK_INPUTS: MockArticleInput[] = [
  {
    slug: "reforma-pensional-conciliacion-senado",
    title:
      "La reforma pensional entra en conciliación con los pilares solidarios como eje del pulso",
    subtitle:
      "Las comisiones económicas deberán zanjar las diferencias sobre el umbral de cotización antes de que termine la legislatura.",
    sourceName: "El Faro Nacional",
    sourceCategory: "nacional",
    author: "Mariana Restrepo",
    publishedAt: "2026-07-28T13:30:00-05:00",
    readingTimeMinutes: 6,
    keywords: ["reforma pensional", "congreso", "pilares solidarios"],
    label: "progresismo",
    weights: { progresismo: 0.41, populismo: 0.18, institucionalismo: 0.14 },
    body: [
      "El texto de la reforma pensional llegó a su etapa de conciliación con un consenso parcial: nadie discute ya la existencia del pilar solidario, pero el umbral de cotización sigue dividiendo a las bancadas. Los ponentes reconocen que el articulado aprobado en plenaria amplía la cobertura para adultos mayores sin pensión, una deuda social que el país arrastra desde hace décadas.",
      "Organizaciones de trabajadores informales celebraron que el proyecto reconozca trayectorias laborales interrumpidas, especialmente las de las mujeres cuidadoras. Para sus voceras, condicionar la protección en la vejez a la cotización continua reproduce desigualdades que el sistema debería corregir.",
      "Los gremios financieros, por su parte, insisten en que el nuevo esquema debe garantizar la sostenibilidad fiscal de largo plazo y piden reglas claras para la administración del ahorro. El Ministerio del Trabajo respondió que las proyecciones actuariales acompañan el articulado y que el debate debe darse con cifras sobre la mesa.",
      "En los cálculos de los conciliadores, el punto más sensible será la transición: quiénes permanecen en el régimen actual y con qué derechos adquiridos. Las próximas dos semanas definirán si la reforma se convierte en ley o si regresa a un nuevo ciclo de debates.",
      "Analistas consultados coinciden en que, más allá del resultado, la discusión instaló en la agenda pública la pregunta por la equidad del sistema: quién aporta, quién queda por fuera y qué papel debe cumplir el Estado en la protección de la vejez.",
    ],
  },
  {
    slug: "autonomia-territorial-consulta-departamentos",
    title:
      "Gobernadores impulsan consulta por la autonomía fiscal de los departamentos",
    subtitle:
      "La iniciativa busca que las regiones administren directamente una porción mayor del recaudo sin pasar por el nivel central.",
    sourceName: "El Andino",
    sourceCategory: "regional",
    author: "Julián Cabal",
    publishedAt: "2026-07-27T09:00:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["autonomía territorial", "descentralización", "regalías"],
    label: "soberanismo",
    weights: { soberanismo: 0.36, institucionalismo: 0.19, doctrinarismo: 0.12 },
    body: [
      "Una coalición de gobernadores radicó ante la Registraduría la solicitud para convocar una consulta popular sobre autonomía fiscal territorial. El propósito, explican, es que los departamentos decidan sobre una fracción mayor de los recursos que se generan en sus territorios sin esperar la intermediación de Bogotá.",
      "Los promotores sostienen que la centralización del gasto ha dejado a las regiones dependientes de transferencias que llegan tarde y condicionadas. \"Las decisiones sobre nuestras vías terciarias no pueden seguir tomándose a seiscientos kilómetros de distancia\", señaló uno de los mandatarios seccionales durante la radicación.",
      "El Ministerio de Hacienda advirtió que cualquier modificación al esquema de transferencias debe respetar el marco fiscal de mediano plazo y pasar por el Congreso. Juristas consultados recuerdan que la Corte Constitucional ha fijado límites precisos a las consultas que comprometen asuntos presupuestales.",
      "En las regiones, la propuesta revive un debate de vieja data sobre el equilibrio entre unidad nacional y autogobierno. Las federaciones de municipios anunciaron foros públicos para discutir los alcances técnicos de la iniciativa antes de que avance cualquier trámite.",
    ],
  },
  {
    slug: "acuerdo-comercial-pacifico-ratificacion",
    title:
      "Colombia avanza hacia la ratificación del acuerdo comercial con el bloque del Pacífico",
    subtitle:
      "La cancillería defiende el tratado como una puerta a cadenas de valor asiáticas; críticos piden salvaguardas para el agro.",
    sourceName: "Actualidad Empresarial",
    sourceCategory: "gremial",
    author: "Silvia Perdomo",
    publishedAt: "2026-07-26T07:45:00-05:00",
    readingTimeMinutes: 7,
    keywords: ["comercio exterior", "tratados", "integración"],
    label: "globalismo",
    weights: { globalismo: 0.39, doctrinarismo: 0.15, soberanismo: 0.13 },
    body: [
      "El Gobierno radicó en el Congreso el proyecto de ley aprobatoria del acuerdo de asociación económica con el bloque del Pacífico, un tratado negociado durante tres años que eliminaría aranceles para cerca del ochenta por ciento de las líneas comerciales entre las partes.",
      "La Cancillería y el Ministerio de Comercio defendieron el texto ante las comisiones segundas con un argumento central: la integración a cadenas de valor asiáticas es la vía más corta para diversificar una canasta exportadora todavía dominada por bienes primarios.",
      "Los gremios industriales respaldaron la ratificación, aunque solicitaron una agenda interna de competitividad que acompañe la apertura: logística portuaria, vías y energía a costos comparables con los de los socios del acuerdo.",
      "Las organizaciones campesinas, en cambio, pidieron salvaguardas para productos sensibles como el maíz y la leche, y recordaron experiencias previas en las que la promesa exportadora tardó más que el golpe de las importaciones.",
      "El debate de ratificación se anuncia extenso. Los ponentes acordaron audiencias públicas en tres ciudades portuarias y un panel técnico sobre los mecanismos de solución de controversias del tratado, uno de los capítulos que más preguntas genera entre los congresistas.",
    ],
  },
  {
    slug: "gran-marcha-pueblo-reformas-sociales",
    title:
      "\"El pueblo no se cansa\": multitudinaria movilización respalda el paquete de reformas sociales",
    subtitle:
      "Los convocantes hablan de una jornada histórica contra el bloqueo de las élites legislativas; la oposición denuncia uso político de la tarima.",
    sourceName: "Contraluz Digital",
    sourceCategory: "independiente",
    author: "Redacción Contraluz",
    publishedAt: "2026-07-25T18:20:00-05:00",
    readingTimeMinutes: 4,
    keywords: ["movilización", "reformas sociales", "protesta"],
    label: "populismo",
    weights: { populismo: 0.44, progresismo: 0.2, personalismo: 0.12 },
    body: [
      "Decenas de miles de personas coparon las plazas centrales de las principales ciudades para respaldar el paquete de reformas sociales que hace tránsito en el Congreso. Desde la tarima principal, los oradores repitieron la consigna de la jornada: las mayorías no pueden seguir esperando a que \"los de siempre\" decidan por ellas.",
      "Los convocantes calificaron la movilización como un mandato directo de la gente frente a lo que llaman el bloqueo sistemático de las élites legislativas. \"Aquí está el verdadero constituyente primario\", dijo una de las voceras del comité organizador ante la multitud.",
      "Sectores de oposición cuestionaron el tono de la jornada y señalaron que convertir la plaza pública en instrumento de presión sobre el legislativo erosiona la deliberación institucional. Pidieron que las diferencias se tramiten en las comisiones y no \"a punta de megáfono\".",
      "Al cierre de la jornada, los organizadores anunciaron un calendario de nuevas concentraciones que acompañará cada votación clave de las reformas durante lo que resta de la legislatura.",
    ],
  },
  {
    slug: "corte-tutela-consulta-previa-mineria",
    title:
      "La Corte ampara la consulta previa y frena licencia minera en el suroccidente",
    subtitle:
      "El alto tribunal reiteró su jurisprudencia: sin participación efectiva de las comunidades no hay licencia ambiental válida.",
    sourceName: "Expediente Legal",
    sourceCategory: "judicial",
    author: "Camilo Andrade",
    publishedAt: "2026-07-24T11:10:00-05:00",
    readingTimeMinutes: 6,
    keywords: ["consulta previa", "corte constitucional", "minería"],
    label: "institucionalismo",
    weights: {
      institucionalismo: 0.42,
      progresismo: 0.16,
      doctrinarismo: 0.12,
    },
    body: [
      "La Corte Constitucional concedió la tutela interpuesta por comunidades del suroccidente del país y dejó sin efectos la licencia ambiental de un proyecto minero de gran escala. La Sala reiteró que la consulta previa no es un requisito formal sino un derecho fundamental cuya omisión vicia todo el procedimiento.",
      "En la sentencia, el tribunal ordenó rehacer el proceso de participación con acompañamiento de la Procuraduría y la Defensoría del Pueblo, y fijó un plazo de seis meses para que la autoridad ambiental documente la deliberación con las comunidades afectadas.",
      "El fallo insiste en la arquitectura institucional del Estado social de derecho: ninguna autoridad, recuerda la Corte, puede sacrificar procedimientos constitucionales en nombre de la celeridad económica, porque son precisamente esos procedimientos los que legitiman las decisiones públicas.",
      "La empresa titular del proyecto anunció que acatará la decisión y pidió reglas de juego estables. Expertos en derecho ambiental anticipan que la sentencia se convertirá en precedente obligado para una decena de licencias en trámite.",
      "Las comunidades accionantes celebraron el amparo como una victoria del derecho sobre el hecho cumplido, y anunciaron veedurías ciudadanas para vigilar el nuevo proceso de consulta.",
    ],
  },
  {
    slug: "presidencia-alocucion-resultados-gobierno",
    title:
      "En alocución, el jefe de Estado presenta su balance: \"Este proyecto es imparable porque es del pueblo\"",
    subtitle:
      "El mandatario personalizó los logros del cuatrienio y anunció que recorrerá el país para defender su legado \"plaza por plaza\".",
    sourceName: "Agencia Estatal de Noticias",
    sourceCategory: "institucional",
    author: null,
    publishedAt: "2026-07-23T20:00:00-05:00",
    readingTimeMinutes: 4,
    keywords: ["gobierno", "alocución", "balance"],
    label: "personalismo",
    weights: { personalismo: 0.4, populismo: 0.22, soberanismo: 0.1 },
    body: [
      "En una alocución transmitida por todos los canales públicos, el jefe de Estado presentó el balance de su gestión con un mensaje construido alrededor de su liderazgo: los avances sociales del cuatrienio, dijo, existen porque hubo \"una voluntad que no se dejó doblar\" de los intereses que se le atravesaron.",
      "El mandatario repasó cifras de cobertura en salud rural, titulación de tierras y electrificación veredal, y en cada capítulo del balance subrayó su intervención personal para destrabar los proyectos. \"Donde los técnicos veían imposibles, nosotros pusimos decisión política\", afirmó.",
      "Anunció además una gira nacional para defender lo que llamó su legado, con encuentros directos con la ciudadanía \"sin intermediarios ni maquinarias\". La agenda, explicó, la definirá él mismo semana a semana según \"lo que la gente pida\".",
      "Voceros de la oposición reaccionaron señalando que los logros de un gobierno pertenecen a las instituciones y no a una persona, y cuestionaron el uso de la alocución oficial para lo que consideran una campaña anticipada.",
    ],
  },
  {
    slug: "partido-conservador-familia-educacion",
    title:
      "El conservatismo presenta su agenda legislativa: familia, seguridad y libertad religiosa",
    subtitle:
      "La colectividad anunció que se opondrá a la cátedra de educación integral aprobada en primer debate.",
    sourceName: "Tribuna Abierta",
    sourceCategory: "opinion",
    author: "Inés Valderrama",
    publishedAt: "2026-07-22T15:30:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["partidos", "familia", "educación"],
    label: "conservadurismo",
    weights: {
      conservadurismo: 0.43,
      doctrinarismo: 0.17,
      institucionalismo: 0.11,
    },
    body: [
      "La bancada conservadora presentó su agenda para la nueva legislatura con tres prioridades declaradas: protección de la familia, seguridad ciudadana y garantías para la libertad religiosa y de conciencia en la escuela pública.",
      "El anuncio central fue su oposición a la cátedra de educación integral aprobada en primer debate. Para la colectividad, el Estado no puede sustituir a los padres en la formación moral de sus hijos, y cualquier contenido en esa materia debe contar con el consentimiento explícito de las familias.",
      "Los voceros de la bancada defendieron además el fortalecimiento de penas para reincidentes y un régimen de apoyo a las iglesias que prestan servicios sociales en zonas apartadas, a las que describieron como \"el tejido que ha sostenido a las comunidades donde el Estado no llega\".",
      "Sectores progresistas replicaron que la escuela pública debe formar en derechos y diversidad, y anunciaron que defenderán la cátedra en los debates restantes. El pulso educativo se perfila como uno de los ejes del semestre legislativo.",
    ],
  },
  {
    slug: "programa-doctrina-economica-partido-verde-fiscal",
    title:
      "Con un documento de 120 páginas, la coalición de centro fija su doctrina económica",
    subtitle:
      "El programa propone regla fiscal reforzada, independencia técnica del banco central y focalización del gasto social.",
    sourceName: "Foro Ciudadano",
    sourceCategory: "opinion",
    author: "Andrés Caviedes",
    publishedAt: "2026-07-21T08:00:00-05:00",
    readingTimeMinutes: 8,
    keywords: ["programa económico", "regla fiscal", "partidos"],
    label: "doctrinarismo",
    weights: { doctrinarismo: 0.38, institucionalismo: 0.2, globalismo: 0.12 },
    body: [
      "La coalición de centro publicó un documento programático de ciento veinte páginas en el que fija posición sobre política fiscal, monetaria y social. El texto, elaborado por su comité técnico durante ocho meses, pretende ordenar el debate interno alrededor de tesis explícitas y verificables.",
      "El programa propone una regla fiscal reforzada con cláusulas de escape taxativas, defiende la independencia técnica del banco central como principio innegociable y plantea migrar los subsidios generalizados hacia transferencias focalizadas con evaluación de impacto obligatoria.",
      "A diferencia de los manifiestos de coyuntura, el documento incluye memorias de cálculo, escenarios de estrés y una sección de disensos internos con las posiciones minoritarias documentadas. \"Un partido serio le muestra al país cómo piensa, no solo qué promete\", dice la introducción.",
      "Los analistas destacaron el ejercicio como una rareza en la política nacional, más acostumbrada al caudillismo electoral que a la disciplina programática. La coalición anunció que someterá el documento a congresos regionales antes de adoptarlo como plataforma oficial.",
    ],
  },
  {
    slug: "renegociacion-tratado-inversion-clausulas",
    title:
      "Gobierno notifica la renegociación del tratado de inversión: \"La soberanía regulatoria no se arbitra\"",
    subtitle:
      "El equipo negociador buscará excluir la salud pública y el ambiente de los tribunales internacionales de arbitraje.",
    sourceName: "Diario de la República",
    sourceCategory: "nacional",
    author: "Tomás Iriarte",
    publishedAt: "2026-07-20T10:30:00-05:00",
    readingTimeMinutes: 6,
    keywords: ["tratados de inversión", "arbitraje", "soberanía"],
    label: "soberanismo",
    weights: { soberanismo: 0.41, globalismo: 0.14, progresismo: 0.13 },
    body: [
      "El Gobierno notificó formalmente su intención de renegociar el tratado bilateral de inversión vigente desde hace dos décadas. El argumento central: las cláusulas de arbitraje internacional han operado como un cerrojo sobre la capacidad del Estado para regular en salud pública, ambiente y servicios esenciales.",
      "\"Ningún tribunal privado puede tener la última palabra sobre lo que una democracia decide para proteger a su gente\", declaró la jefa del equipo negociador al anunciar la hoja de ruta, que contempla dieciocho meses de conversaciones.",
      "El país acumula demandas multimillonarias ante tribunales de arbitraje por decisiones regulatorias, varias de ellas relacionadas con la delimitación de ecosistemas estratégicos. Para el Gobierno, ese historial demuestra que el tratado quedó desbalanceado en contra del interés público.",
      "Cámaras binacionales de comercio pidieron prudencia y advirtieron que la seguridad jurídica es determinante para atraer capital de largo plazo. El equipo negociador respondió que la meta no es cerrar la puerta a la inversión sino recuperar el margen regulatorio del Estado.",
    ],
  },
  {
    slug: "cumbre-latinoamericana-transicion-energetica",
    title:
      "El país sella en la cumbre regional una alianza multilateral por la transición energética",
    subtitle:
      "Doce Estados firmaron compromisos verificables de descarbonización y un fondo común de financiamiento climático.",
    sourceName: "El Faro Nacional",
    sourceCategory: "nacional",
    author: "Laura Quiñones",
    publishedAt: "2026-07-19T16:45:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["transición energética", "multilateralismo", "clima"],
    label: "globalismo",
    weights: { globalismo: 0.4, progresismo: 0.18, institucionalismo: 0.12 },
    body: [
      "Doce países de la región firmaron en la cumbre latinoamericana una alianza por la transición energética que incluye metas verificables de descarbonización, un fondo común de financiamiento climático y un mecanismo de revisión entre pares inspirado en las prácticas de la OCDE.",
      "La delegación nacional jugó un papel articulador en la negociación del fondo, que arrancará con aportes escalonados según el tamaño de cada economía y podrá apalancar recursos de la banca multilateral de desarrollo.",
      "\"Los problemas que cruzan fronteras solo se resuelven con instituciones que crucen fronteras\", resumió el canciller al término de la sesión plenaria, en la que también se acordó una posición conjunta para la próxima conferencia mundial del clima.",
      "Organizaciones ambientales valoraron el acuerdo aunque pidieron que los compromisos se traduzcan pronto en cronogramas nacionales. El sector eléctrico, por su parte, destacó la señal de estabilidad regulatoria regional que envía el pacto a los inversionistas.",
    ],
  },
  {
    slug: "lider-opositor-caravana-firmas",
    title:
      "El líder opositor lanza caravana nacional: \"Yo sí sé cómo se arregla este país\"",
    subtitle:
      "Sin programa publicado, la precampaña se apoya en la biografía del dirigente y en encuentros multitudinarios.",
    sourceName: "Panorama Independiente",
    sourceCategory: "independiente",
    author: "Rosa E. Manrique",
    publishedAt: "2026-07-18T12:15:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["precampaña", "oposición", "liderazgo"],
    label: "personalismo",
    weights: { personalismo: 0.39, conservadurismo: 0.18, populismo: 0.16 },
    body: [
      "El principal dirigente de la oposición inició una caravana por veinte ciudades para recoger firmas que respalden su aspiración presidencial. La gira, bautizada con su propio apellido, no tiene todavía un programa publicado: la promesa central es su experiencia y su carácter.",
      "\"Los partidos hablan de comités y ponencias; yo hablo de resultados. Yo sí sé cómo se arregla este país\", repitió el dirigente en la plaza que abrió el recorrido, ante seguidores que coreaban su nombre.",
      "Dentro de su propio movimiento, algunas voces piden estructura colegiada y tesis programáticas que sobrevivan al líder. La respuesta del comando ha sido pragmática: primero las firmas y la conexión popular, después los documentos.",
      "Politólogos consultados ven en la caravana un síntoma del ciclo personalista de la política nacional: colectividades convertidas en vehículos electorales de una figura, con la deliberación interna reducida al mínimo.",
    ],
  },
  {
    slug: "procuraduria-protocolo-transparencia-contratacion",
    title:
      "Procuraduría expide protocolo que endurece la vigilancia de la contratación directa",
    subtitle:
      "El órgano de control estandariza reportes y crea tableros públicos de seguimiento en tiempo real.",
    sourceName: "Boletín del Estado",
    sourceCategory: "institucional",
    author: null,
    publishedAt: "2026-07-17T09:40:00-05:00",
    readingTimeMinutes: 4,
    keywords: ["contratación pública", "transparencia", "control"],
    label: "institucionalismo",
    weights: {
      institucionalismo: 0.45,
      doctrinarismo: 0.14,
      conservadurismo: 0.1,
    },
    body: [
      "La Procuraduría General expidió un protocolo que endurece la vigilancia preventiva sobre la contratación directa en todas las entidades del orden nacional y territorial. La medida estandariza los reportes, fija plazos perentorios de publicación y crea tableros de seguimiento abiertos a la ciudadanía.",
      "El protocolo obliga a justificar por escrito la excepcionalidad de cada contratación directa y somete las de mayor cuantía a revisión previa de una sala especializada. Las entidades tendrán noventa días para adecuar sus procedimientos internos.",
      "\"La regla general es la licitación pública; la excepción tiene que argumentarse ante el país\", señaló el órgano de control en el documento técnico que acompaña la directiva.",
      "Veedurías ciudadanas y organizaciones de transparencia recibieron la medida como un avance en el fortalecimiento del control institucional, y anunciaron que usarán los nuevos tableros para auditar la contratación en las regiones.",
    ],
  },
  {
    slug: "asamblea-cafetera-precio-interno",
    title:
      "La asamblea cafetera pide banda de sustentación para el precio interno del grano",
    subtitle:
      "Los productores alertan por el costo de los fertilizantes y piden renegociar la fórmula del precio de referencia.",
    sourceName: "Agenda Cafetera",
    sourceCategory: "gremial",
    author: "Héctor Salgado",
    publishedAt: "2026-07-16T07:00:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["café", "precio interno", "gremios"],
    label: "doctrinarismo",
    weights: { doctrinarismo: 0.3, soberanismo: 0.22, populismo: 0.14 },
    body: [
      "La asamblea nacional de productores de café aprobó solicitar al Gobierno una banda de sustentación para el precio interno del grano, financiada con recursos del fondo de estabilización y activable cuando la cotización internacional caiga por debajo de los costos de producción.",
      "El documento técnico de la asamblea detalla la fórmula propuesta, los gatillos de activación y las fuentes de fondeo, y pide además renegociar la metodología del precio de referencia para incorporar el encarecimiento de fertilizantes e insumos importados.",
      "Los delegados regionales insistieron en que la caficultura no pide subsidios permanentes sino reglas contracíclicas conocidas de antemano. \"Queremos una política de Estado escrita, no auxilios de coyuntura\", resumió la ponencia central.",
      "El Ministerio de Agricultura se comprometió a evaluar la propuesta en una mesa técnica conjunta que deberá entregar conclusiones antes de la próxima cosecha principal.",
    ],
  },
  {
    slug: "reforma-educacion-superior-gratuidad",
    title:
      "Avanza la reforma a la educación superior: gratuidad progresiva y nueva política de bienestar",
    subtitle:
      "El proyecto amplía cupos en regiones y crea un sistema de acompañamiento para reducir la deserción.",
    sourceName: "El Faro Nacional",
    sourceCategory: "nacional",
    author: "Valentina Ortiz",
    publishedAt: "2026-07-15T14:20:00-05:00",
    readingTimeMinutes: 6,
    keywords: ["educación superior", "gratuidad", "reforma"],
    label: "progresismo",
    weights: { progresismo: 0.44, institucionalismo: 0.15, populismo: 0.12 },
    body: [
      "La plenaria de la Cámara aprobó en segundo debate la reforma a la educación superior, que consagra la gratuidad progresiva en las instituciones públicas empezando por los hogares de menores ingresos y los territorios históricamente excluidos.",
      "El proyecto crea además una política nacional de bienestar estudiantil con transporte, alimentación y acompañamiento psicosocial, dirigida a reducir una deserción que golpea sobre todo a los estudiantes de primera generación universitaria.",
      "Las asociaciones estudiantiles acompañaron el debate desde las barras y celebraron la inclusión de enfoques diferenciales para comunidades étnicas y rurales. \"La universidad pública empieza a parecerse al país\", dijo una de sus voceras.",
      "Los rectores respaldaron el espíritu de la reforma pero pidieron claridad sobre las fuentes de financiación de largo plazo. El Ministerio de Educación aseguró que el marco fiscal contempla el escalamiento gradual de los recursos.",
      "El texto pasa ahora al Senado, donde las bancadas anunciaron un debate intenso sobre el capítulo de financiación y sobre las condiciones de calidad exigibles a las instituciones beneficiarias.",
    ],
  },
  {
    slug: "consejo-gremial-salario-minimo-productividad",
    title:
      "Consejo gremial propone atar el salario mínimo a la productividad con fórmula plurianual",
    subtitle:
      "El planteamiento busca despolitizar la mesa de concertación; las centrales obreras lo rechazan de plano.",
    sourceName: "Actualidad Empresarial",
    sourceCategory: "gremial",
    author: "Federico Lemos",
    publishedAt: "2026-07-14T08:30:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["salario mínimo", "productividad", "concertación"],
    label: "conservadurismo",
    weights: {
      conservadurismo: 0.32,
      doctrinarismo: 0.24,
      globalismo: 0.12,
    },
    body: [
      "El consejo gremial presentó una propuesta para que el ajuste anual del salario mínimo siga una fórmula plurianual basada en inflación causada más ganancias verificadas de productividad, con revisión técnica independiente cada tres años.",
      "Para los empresarios, la negociación de diciembre se ha convertido en un ritual político que introduce incertidumbre en la creación de empleo formal. Una regla estable, argumentan, protegería tanto el poder adquisitivo como la disciplina de costos que exige la competencia internacional.",
      "Las centrales obreras rechazaron la iniciativa y defendieron la concertación tripartita como conquista histórica de los trabajadores. Convertir el salario en una fórmula, replicaron, es despojar a las partes de una deliberación que también es social y no solo técnica.",
      "El Ministerio del Trabajo tomó nota de la propuesta sin comprometerse, y recordó que cualquier cambio metodológico requiere consenso en la comisión permanente de políticas salariales.",
    ],
  },
  {
    slug: "tribunal-electoral-financiacion-campanas",
    title:
      "Tribunal electoral sanciona a tres campañas por violar topes de financiación",
    subtitle:
      "La decisión ratifica la línea dura del órgano frente a los aportes no reportados y ordena compulsar copias a la Fiscalía.",
    sourceName: "Observatorio Judicial",
    sourceCategory: "judicial",
    author: "Patricia Camargo",
    publishedAt: "2026-07-13T13:00:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["financiación de campañas", "sanciones", "elecciones"],
    label: "institucionalismo",
    weights: {
      institucionalismo: 0.4,
      doctrinarismo: 0.16,
      progresismo: 0.11,
    },
    body: [
      "El tribunal electoral impuso sanciones económicas a tres campañas de las pasadas elecciones territoriales por superar los topes de gastos y omitir el reporte de aportes en especie. La decisión, adoptada por unanimidad, ordena además compulsar copias a la Fiscalía.",
      "La sala sustentó su decisión en el sistema de auditoría cruzada implementado desde el último ciclo electoral, que contrasta los reportes contables de las campañas con la facturación de proveedores de publicidad y logística.",
      "\"Los topes de financiación no son formalismos: son la garantía de que las elecciones se ganan con votos y no con chequeras\", señala la providencia en su capítulo central.",
      "Las campañas sancionadas anunciaron recursos de reposición. Organizaciones de observación electoral celebraron el fallo y pidieron dotar al órgano de mayor capacidad técnica permanente para vigilar el próximo calendario electoral.",
    ],
  },
  {
    slug: "plan-nacional-cuidado-comunitario",
    title:
      "El Gobierno presenta el plan nacional de cuidado con enfoque comunitario y de género",
    subtitle:
      "Las manzanas del cuidado llegarán a sesenta municipios; el programa reconoce el trabajo no remunerado de las cuidadoras.",
    sourceName: "Agencia Estatal de Noticias",
    sourceCategory: "institucional",
    author: null,
    publishedAt: "2026-07-12T10:00:00-05:00",
    readingTimeMinutes: 4,
    keywords: ["economía del cuidado", "género", "política social"],
    label: "progresismo",
    weights: { progresismo: 0.46, populismo: 0.13, institucionalismo: 0.13 },
    body: [
      "El Gobierno nacional presentó el plan de cuidado comunitario que llevará servicios de apoyo, formación y respiro a cuidadoras y cuidadores en sesenta municipios priorizados, con inversión inicial de medio billón de pesos.",
      "El programa reconoce el trabajo de cuidado no remunerado —realizado en su gran mayoría por mujeres— como un pilar de la economía, y crea rutas de certificación de saberes y acceso preferente a educación técnica para quienes lo ejercen.",
      "Las organizaciones feministas que acompañaron el diseño destacaron que el plan adopta un enfoque comunitario en lugar de asistencial: las manzanas del cuidado serán cogestionadas con redes barriales y organizaciones de base.",
      "La oposición cuestionó el anuncio por considerar que duplica programas existentes. El Departamento de Planeación respondió que el plan integra oferta dispersa bajo un solo sistema de información y seguimiento.",
    ],
  },
  {
    slug: "debate-control-politico-orden-publico-frontera",
    title:
      "Agrio debate de control político por la seguridad en la frontera",
    subtitle:
      "La oposición exige resultados contra las economías ilegales; el Gobierno defiende su estrategia de presencia integral del Estado.",
    sourceName: "Diario de la República",
    sourceCategory: "nacional",
    author: "Ernesto Palacios",
    publishedAt: "2026-07-11T17:30:00-05:00",
    readingTimeMinutes: 6,
    keywords: ["seguridad", "frontera", "control político"],
    label: "conservadurismo",
    weights: {
      conservadurismo: 0.34,
      institucionalismo: 0.21,
      soberanismo: 0.15,
    },
    body: [
      "El debate de control político sobre la seguridad en la frontera se extendió por más de siete horas y dejó posiciones encontradas. La oposición presentó cifras de extorsión y contrabando en aumento y acusó al Gobierno de ceder el control territorial a las economías ilegales.",
      "Los citantes reclamaron el restablecimiento del orden como prioridad: más pie de fuerza, fiscalías especializadas de frontera y un régimen de penas endurecido para los delitos que golpean al comercio formal y a las familias de la región.",
      "El Ministerio de Defensa respondió con los avances de su estrategia de presencia integral: judicialización de cabecillas, inversión social en municipios priorizados y cooperación con el país vecino en el control aduanero.",
      "Al cierre del debate, las bancadas acordaron conformar una comisión de seguimiento que visitará la zona y presentará un informe conjunto antes de que termine el semestre, en un inusual gesto de trabajo institucional entre orillas opuestas.",
    ],
  },
  {
    slug: "referendo-revocatoria-congreso-firmas",
    title:
      "Comité ciudadano radica firmas para referendo que permitiría revocar congresistas",
    subtitle:
      "\"Que el pueblo pueda echar a los que no cumplen\": la iniciativa desafía el diseño constitucional vigente.",
    sourceName: "Contraluz Digital",
    sourceCategory: "independiente",
    author: "Redacción Contraluz",
    publishedAt: "2026-07-10T11:45:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["referendo", "revocatoria", "participación"],
    label: "populismo",
    weights: { populismo: 0.42, personalismo: 0.15, soberanismo: 0.13 },
    body: [
      "Un comité ciudadano radicó ante la Registraduría más de dos millones de firmas para convocar un referendo que introduciría la revocatoria del mandato de los congresistas, figura que hoy solo existe para alcaldes y gobernadores.",
      "\"Los senadores se eligen prometiendo y gobiernan olvidando. Que el pueblo pueda echar a los que no cumplen\", dijo el vocero del comité al entregar las cajas de firmas, rodeado de simpatizantes que agitaban banderas nacionales.",
      "Constitucionalistas advierten que la propuesta choca con el diseño de la representación: el congresista, argumentan, representa a la nación entera y no a un electorado revocador, por lo que la figura exigiría una reforma de fondo al régimen político.",
      "Para los promotores, esa objeción confirma su diagnóstico: las élites jurídicas, dicen, siempre encuentran razones para blindarse del control popular. La verificación de firmas tomará hasta tres meses.",
    ],
  },
  {
    slug: "politica-industrial-aranceles-textiles",
    title:
      "Gobierno sube aranceles a confecciones importadas: \"Primero la industria nacional\"",
    subtitle:
      "La medida protege al sector textil por dos años; importadores advierten alzas de precios al consumidor.",
    sourceName: "La Voz del Magdalena",
    sourceCategory: "regional",
    author: "Josefina Barrios",
    publishedAt: "2026-07-09T09:15:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["aranceles", "industria textil", "proteccionismo"],
    label: "soberanismo",
    weights: { soberanismo: 0.38, populismo: 0.17, doctrinarismo: 0.13 },
    body: [
      "El Gobierno expidió el decreto que eleva por dos años los aranceles a las confecciones importadas, con el argumento de defender el empleo de la industria textil nacional frente a lo que califica como competencia desleal de mercancía subvalorada.",
      "\"Un país que no protege su aparato productivo termina dependiendo de contenedores ajenos hasta para vestirse\", dijo el ministro de Comercio al presentar la medida en una zona franca textil, ante cientos de operarias del sector.",
      "Los importadores y las grandes superficies advirtieron que el arancel encarecerá la canasta de vestuario para los hogares y anunciaron demandas ante los jueces administrativos por presunta violación de compromisos comerciales.",
      "Los sindicatos textileros celebraron la decisión como un respiro para las plantas regionales, aunque pidieron que la protección venga acompañada de crédito de fomento y modernización tecnológica para competir cuando expire la salvaguardia.",
    ],
  },
  {
    slug: "mision-observacion-onu-informe-paz",
    title:
      "Misión internacional entrega informe sobre la implementación del acuerdo de paz",
    subtitle:
      "El documento destaca avances en reincorporación y pide acelerar la reforma rural con veeduría multilateral.",
    sourceName: "Panorama Independiente",
    sourceCategory: "independiente",
    author: "Gabriel Useche",
    publishedAt: "2026-07-08T15:00:00-05:00",
    readingTimeMinutes: 6,
    keywords: ["paz", "verificación internacional", "reforma rural"],
    label: "globalismo",
    weights: {
      globalismo: 0.35,
      institucionalismo: 0.22,
      progresismo: 0.14,
    },
    body: [
      "La misión internacional de verificación entregó su informe semestral sobre la implementación del acuerdo de paz, con un balance mixto: avances sostenidos en reincorporación económica de excombatientes y rezagos persistentes en los planes de la reforma rural.",
      "El documento recomienda profundizar la cooperación técnica internacional en catastro y titulación, y propone que la banca multilateral acompañe la financiación de las obras territoriales pendientes en los municipios más afectados por el conflicto.",
      "\"La paz colombiana sigue siendo un bien público global\", señala el informe, que valora el escrutinio conjunto de la comunidad internacional como un incentivo para que los compromisos no dependan de los ciclos políticos internos.",
      "El Gobierno recibió el informe y anunció una mesa interinstitucional para responder punto por punto las recomendaciones. Las plataformas de derechos humanos pidieron que la respuesta incluya cronogramas verificables.",
    ],
  },
  {
    slug: "alcaldes-ciudades-capitales-seguridad-percepcion",
    title:
      "Alcaldes de ciudades capitales piden mano firme y más competencias en seguridad",
    subtitle:
      "El bloque de mandatarios propone endurecer el código de policía y ampliar la vigilancia con cámaras de reconocimiento.",
    sourceName: "El Andino",
    sourceCategory: "regional",
    author: "Ricardo Peña",
    publishedAt: "2026-07-07T12:30:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["seguridad urbana", "alcaldes", "código de policía"],
    label: "conservadurismo",
    weights: {
      conservadurismo: 0.37,
      personalismo: 0.16,
      institucionalismo: 0.15,
    },
    body: [
      "El bloque de alcaldes de ciudades capitales presentó un paquete de propuestas en materia de seguridad urbana: endurecimiento del código de policía, traslado ágil de competencias a las administraciones locales y ampliación de los sistemas de videovigilancia con analítica avanzada.",
      "Los mandatarios argumentan que la ciudadanía reclama orden en el espacio público y resultados visibles contra el hurto y la extorsión al comercio. \"La primera libertad es caminar tranquilo a casa\", dijo el vocero del bloque.",
      "Organizaciones de derechos digitales expresaron reparos frente al reconocimiento facial masivo y pidieron un marco legal previo con controles judiciales estrictos, alertando por el riesgo de vigilancia desproporcionada.",
      "El Ministerio del Interior se mostró abierto a discutir el traslado de competencias, pero condicionó cualquier reforma al respeto de los estándares constitucionales sobre uso de la fuerza y protección de datos.",
    ],
  },
  {
    slug: "bancadas-alternativas-estatuto-trabajo",
    title:
      "Bancadas alternativas radican el estatuto del trabajo que ordena la Constitución",
    subtitle:
      "El proyecto formaliza plataformas digitales, fortalece la negociación colectiva y reduce la jornada nocturna.",
    sourceName: "Tribuna Abierta",
    sourceCategory: "opinion",
    author: "Cecilia Marulanda",
    publishedAt: "2026-07-06T08:45:00-05:00",
    readingTimeMinutes: 6,
    keywords: ["estatuto del trabajo", "plataformas", "derechos laborales"],
    label: "progresismo",
    weights: { progresismo: 0.4, doctrinarismo: 0.18, populismo: 0.13 },
    body: [
      "Las bancadas alternativas radicaron el proyecto de estatuto del trabajo, una deuda que la Constitución ordena saldar desde 1991. El texto presume la laboralidad de los repartidores de plataformas digitales, fortalece la negociación colectiva por rama y restablece los recargos nocturnos plenos.",
      "Las autoras del proyecto sostienen que la transformación tecnológica no puede ser excusa para precarizar: \"la aplicación no es el empleador invisible; detrás hay una empresa con obligaciones\", dijo la coordinadora ponente en la radicación.",
      "Las plataformas tecnológicas advirtieron que la presunción de laboralidad encarecería el servicio y propusieron en su lugar una categoría intermedia con protección social proporcional a las horas conectadas.",
      "El debate promete ser uno de los más intensos de la legislatura: los sindicatos anunciaron movilizaciones de acompañamiento y los gremios pidieron audiencias técnicas sobre el impacto en el empleo juvenil.",
    ],
  },
  {
    slug: "jurisdiccion-agraria-jueces-tierras",
    title:
      "Arranca la jurisdicción agraria: los primeros cincuenta jueces de tierras toman posesión",
    subtitle:
      "La nueva justicia especializada deberá resolver conflictos de propiedad rural que llevan décadas represados.",
    sourceName: "Expediente Legal",
    sourceCategory: "judicial",
    author: "Camilo Andrade",
    publishedAt: "2026-07-05T10:20:00-05:00",
    readingTimeMinutes: 5,
    keywords: ["jurisdicción agraria", "tierras", "justicia"],
    label: "institucionalismo",
    weights: {
      institucionalismo: 0.38,
      progresismo: 0.19,
      doctrinarismo: 0.13,
    },
    body: [
      "Con la posesión de los primeros cincuenta jueces de tierras entró en funcionamiento la jurisdicción agraria, creada para resolver los conflictos de propiedad y uso del suelo rural que la justicia ordinaria mantuvo represados durante décadas.",
      "Los nuevos despachos, distribuidos en las zonas con mayor conflictividad agraria, operarán con procedimientos orales y con reglas probatorias que reconocen la posesión material y las formas comunitarias de tenencia.",
      "El Consejo Superior de la Judicatura destacó que la selección de los jueces se hizo por concurso público de méritos con veeduría de las universidades, y anunció la segunda cohorte de despachos para el próximo año.",
      "Organizaciones campesinas y gremios ganaderos coincidieron —desde orillas distintas— en que la seguridad jurídica sobre la tierra es condición para la paz rural, aunque difieren sobre las prioridades de la nueva jurisdicción.",
    ],
  },
];

export const MOCK_ARTICLES: ArticleDetailDTO[] = MOCK_INPUTS.map(buildArticle);
