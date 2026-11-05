"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineDashedMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import {
  AXIS_COUNT,
  AXIS_STEP,
  EASE_IN_OUT,
  EASE_OUT,
  HEAT_STOPS,
  HEATMAP_AXES,
  ISO_LEVELS,
  heatLevel,
} from "@/lib/heatmap";
import type { IdeologyDistribution } from "@/types/ideology";

export interface Radar3DProps {
  probabilities: IdeologyDistribution;
  /** Eje que se lee ahora (puntero o foco). */
  active: number;
  /** Eje fijado (se resalta; la cámara no se mueve sola). */
  focus: number;
  onPreview: (index: number | null) => void;
  onChoose: (index: number) => void;
  /** Botón accesible de cada eje (lo dibuja el contenedor). */
  renderLabel: (index: number) => ReactNode;
  /** Sin WebGL: el contenedor cae al mapa 2D. */
  onUnsupported: () => void;
}

/* Geometría (unidades de mundo). La estrella vive en un plano local X–Y
   (radio 1 = 100 %) con el volumen en Z, y se acuesta sobre el piso. Todas
   las clases nacen de un núcleo lleno (la neutralidad, 0 %) y cada una
   levanta una punta curva que se funde con sus vecinas. */
const CORE = 0.2;
/** Ancho angular de la punta (crece con la clase) y redondeo de su filo. */
const LOBE = { width: 0.15, widthGrowth: 0.11, soft: 0.04, softGrowth: 0.09 };
/** Medio grosor: en el centro, y en el borde según lo larga que sea la punta. */
const BODY = { pole: 0.12, rim: 0.07, rimGrowth: 0.11 };
const ANGLES = 384; // múltiplo de 8: hay vértices justo sobre cada eje
const LATITUDES = 40;
const AXIS_LENGTH = 1.06;
const LABEL_RADIUS = 1.17;
/** Resplandor alrededor de la silueta, solo donde la clase es alta. */
const GLOW = { spread: 0.055, light: 0.5, dark: 0.7 };
/** Anillos del plato; 12,5 % es el reparto uniforme. */
const UNIFORM = 1 / AXIS_COUNT;
const RINGS = [...ISO_LEVELS, 1];
const RING_TICKS: ReadonlyArray<readonly [number, string]> = [
  [0.125, "12,5"],
  [0.25, "25"],
  [0.5, "50"],
  [1, "100 %"],
];
const RAMP_STEPS = 256;

/* La caja de referencia, centrada en el radar. Cada plano de rejilla se
   dibuja del lado lejano de la cámara: al rodear el radar nunca lo tapa. */
const BOX = { half: 1.25, height: 0.75, step: 0.25 };
/** Medio lado de la caja en cada eje del mundo (X, Y, Z). */
const BOX_HALF = [BOX.half, BOX.height, BOX.half] as const;

/* Cámara: de lado y un poco desde arriba, como quien mira un objeto sobre
   la mesa. El giro no tiene topes en ninguna dirección. */
const VIEW = { azimuth: -0.6, elevation: 0.55, distance: 3.6 };
const DISTANCE = { min: 2.2, max: 8 };
const DRAG_THRESHOLD = 4;

const ROWS = LATITUDES + 1;
const STAR_VERTICES = ROWS * ANGLES;

/* Resplandor: la misma superficie, inflada un poco por sus normales y
   dibujada por detrás. Se desvanece hacia el borde de la silueta. */
const GLOW_VERTEX = /* glsl */ `
attribute float heat;
uniform float uSpread;
varying vec3 vColor;
varying float vHeat;
varying float vFacing;

void main() {
  vColor = color;
  vHeat = heat;
  vec3 displaced = position + normalize( normal ) * uSpread;
  vec4 mvPosition = modelViewMatrix * vec4( displaced, 1.0 );
  vec3 viewNormal = normalize( normalMatrix * normal );
  vFacing = abs( dot( viewNormal, normalize( -mvPosition.xyz ) ) );
  gl_Position = projectionMatrix * mvPosition;
}
`;
const GLOW_FRAGMENT = /* glsl */ `
uniform float uStrength;
varying vec3 vColor;
varying float vHeat;
varying float vFacing;

void main() {
  float edge = smoothstep( 0.0, 0.75, vFacing );
  // Solo resplandece lo cálido: las zonas frías no dejan halo.
  float alpha = uStrength * edge * smoothstep( 0.3, 0.95, vHeat );
  gl_FragColor = vec4( vColor, alpha );
  #include <colorspace_fragment>
}
`;

type Rgba = [number, number, number, number];

/** Convierte cualquier color CSS (oklch incluido) a sRGB en [0, 1], con alfa. */
function createColorReader() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return (value: string): Rgba => {
    if (!ctx || !value) return [0.5, 0.5, 0.5, 0];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255, a / 255];
  };
}

/** Ángulo del eje en el plano (0 = arriba, sentido horario). */
function axisAngle(index: number) {
  return Math.PI / 2 - index * AXIS_STEP;
}

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** Radio de una clase según su nivel de calor (raíz de la probabilidad). */
function levelRadius(level: number) {
  return CORE + (1 - CORE) * level;
}

/** Radio del contorno en el ángulo `theta`: núcleo + una punta por clase. */
function outline(theta: number, levels: readonly number[]) {
  let radius = CORE;
  for (let axis = 0; axis < AXIS_COUNT; axis++) {
    const level = levels[axis];
    if (level <= 0) continue;
    const width = LOBE.width + LOBE.widthGrowth * level;
    // Las puntas grandes terminan en filo; las chicas, redondeadas.
    const soft = LOBE.soft + LOBE.softGrowth * (1 - level);
    const delta = wrapAngle(theta - axisAngle(axis));
    const distance = Math.sqrt(delta * delta + soft * soft) - soft;
    radius += (1 - CORE) * level * Math.exp(-distance / width);
  }
  return radius;
}

/** Circunferencia en el plano del radar, como puntos de un LineLoop. */
function circlePoints(radius: number, segments = 160) {
  const points = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points[i * 3] = Math.cos(angle) * radius;
    points[i * 3 + 1] = Math.sin(angle) * radius;
  }
  return points;
}

/**
 * Rejilla de un plano de la caja, centrada en el origen. `normal` es el eje
 * perpendicular (0 = X, 1 = Y, 2 = Z): en cada cuadro el plano se corre en
 * ese eje hasta la cara lejana de la caja.
 */
function planeGridPoints(normal: 0 | 1 | 2) {
  const [u, v] = ([0, 1, 2] as const).filter((axis) => axis !== normal);
  const points: number[] = [];
  const push = (a: number, b: number) => {
    const point = [0, 0, 0];
    point[u] = a;
    point[v] = b;
    points.push(...point);
  };
  for (let a = -BOX_HALF[u]; a <= BOX_HALF[u] + 1e-6; a += BOX.step) {
    push(a, -BOX_HALF[v]);
    push(a, BOX_HALF[v]);
  }
  for (let b = -BOX_HALF[v]; b <= BOX_HALF[v] + 1e-6; b += BOX.step) {
    push(-BOX_HALF[u], b);
    push(BOX_HALF[u], b);
  }
  return new Float32Array(points);
}

/** Malla cerrada de la estrella: una sola superficie (latitud × ángulo). */
function buildStarGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(STAR_VERTICES * 3), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(STAR_VERTICES * 3), 3));
  geometry.setAttribute("heat", new BufferAttribute(new Float32Array(STAR_VERTICES), 1));
  const indices = new Uint32Array(LATITUDES * ANGLES * 6);
  let cursor = 0;
  for (let row = 0; row < LATITUDES; row++) {
    for (let seg = 0; seg < ANGLES; seg++) {
      const next = (seg + 1) % ANGLES;
      const a = row * ANGLES + seg;
      const b = row * ANGLES + next;
      const c = (row + 1) * ANGLES + seg;
      const d = (row + 1) * ANGLES + next;
      // El ángulo crece en sentido antihorario y la latitud hacia +Z: así
      // las caras miran hacia afuera.
      indices.set([a, b, d, a, d, c], cursor);
      cursor += 6;
    }
  }
  geometry.setIndex(new BufferAttribute(indices, 1));
  return geometry;
}

interface SceneState {
  view: { azimuth: number; elevation: number; distance: number };
  levels: number[];
  invalidate: () => void;
  applyLevels: (levels: number[]) => void;
  refreshActive: () => void;
}

/**
 * Radar 3D de la distribución: una estrella con volumen acostada sobre un
 * plato con anillos de 5, 12,5 (reparto uniforme), 25, 50 y 100 %. Todas
 * las clases nacen de un núcleo lleno (la neutralidad) y cada una levanta
 * una punta sobre su eje, frente a su opuesta. El largo de la punta crece
 * con la raíz de la probabilidad (así las clases pequeñas siguen a la
 * vista) y el color va del azul del núcleo (0 %) al rojo (100 %), con la
 * misma escala que la leyenda; las puntas calientes resplandecen. Una caja
 * con rejilla en sus tres planos (X, Y y Z) da la profundidad.
 *
 * Recorrido: arrastrar en cualquier dirección rodea el radar sin topes, por
 * encima y por debajo (con inercia); Ctrl/⌘ + rueda o pinza acercan, y el
 * puntero o el teclado leen cada eje. Se dibuja bajo demanda: sin
 * movimiento no hay frames.
 */
export default function IdeologyRadar3D({
  probabilities,
  active,
  onPreview,
  onChoose,
  renderLabel,
  onUnsupported,
}: Radar3DProps) {
  const reduce = useReducedMotion() ?? false;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stateRef = useRef<SceneState | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const callbacks = useRef({ onPreview, onChoose, onUnsupported });
  callbacks.current = { onPreview, onChoose, onUnsupported };
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const cameraTween = useRef<AnimationPlaybackControls | null>(null);

  const signature = HEATMAP_AXES.map((ideologyClass) =>
    heatLevel(probabilities[ideologyClass]).toFixed(4)
  ).join(" ");

  /* Escena: se crea una vez y se libera al desmontar. */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true });
    } catch {
      callbacks.current.onUnsupported();
      return;
    }
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "absolute inset-0 size-full";
    wrapper.prepend(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 50);

    // Reflejos suaves de un cuarto iluminado: el brillo se reparte por la
    // superficie en vez de quedar en puntos de luz. La luz total ronda el
    // 100 %: si se pasa, el color se lava hacia el blanco (pastel).
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    scene.environment = environment;
    scene.environmentIntensity = 0.3;

    scene.add(new HemisphereLight(0xffffff, 0x7d8597, 0.4));
    // Las luces viajan con la cámara: se rodee por donde se rodee, la cara
    // que se mira queda iluminada igual (clave arriba a la izquierda).
    const key = new DirectionalLight(0xffffff, 1);
    key.position.set(-1.5, 2.2, 3);
    const rim = new DirectionalLight(0xffffff, 0.25);
    rim.position.set(2.5, -1, 1.5);
    camera.add(key, rim);
    scene.add(camera);

    /* Plato: bandas alternas entre anillos. Solo tiene cara de arriba:
       mirado desde abajo no tapa la estrella. */
    const plateMaterials = [new MeshBasicMaterial(), new MeshBasicMaterial()];
    const ringRadii = [0, ...RINGS.map((ring) => levelRadius(heatLevel(ring)))];
    const bands = ringRadii.slice(1).map((outer, index) => {
      const band = new Mesh(
        new RingGeometry(ringRadii[index], outer, 160, 1),
        plateMaterials[(RINGS.length - 1 - index) % 2]
      );
      band.position.z = -0.002;
      return band;
    });
    const ringMaterial = new LineBasicMaterial();
    const rimMaterial = new LineBasicMaterial();
    const uniformMaterial = new LineDashedMaterial({ dashSize: 0.025, gapSize: 0.02 });
    const rings = RINGS.map((ring) => {
      const line = new LineLoop(
        new BufferGeometry().setAttribute(
          "position",
          new BufferAttribute(circlePoints(levelRadius(heatLevel(ring))), 3)
        ),
        ring === UNIFORM ? uniformMaterial : ring === 1 ? rimMaterial : ringMaterial
      );
      if (ring === UNIFORM) line.computeLineDistances();
      line.position.z = 0.001;
      return line;
    });

    /* Ejes del plato y el eje activo. */
    const axisPoints: number[] = [];
    HEATMAP_AXES.forEach((_, index) => {
      const angle = axisAngle(index);
      axisPoints.push(0, 0, 0.0015, Math.cos(angle) * AXIS_LENGTH, Math.sin(angle) * AXIS_LENGTH, 0.0015);
    });
    const axisMaterial = new LineBasicMaterial();
    const axes = new LineSegments(
      new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(axisPoints), 3)),
      axisMaterial
    );
    const activeMaterial = new LineBasicMaterial();
    const activeAxis = new LineSegments(
      new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(6), 3)),
      activeMaterial
    );
    const tipMaterial = new MeshBasicMaterial();
    const tip = new Mesh(new SphereGeometry(0.016, 20, 12), tipMaterial);

    /* La estrella: superficie lisa y brillante, con un brillo propio del
       color (como si la luz la atravesara) y el resplandor por detrás. */
    const starGeometry = buildStarGeometry();
    const starUniforms = { uGlow: { value: 0.12 } };
    const starMaterial = new MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.38,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
    });
    starMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, starUniforms);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uGlow;")
        .replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow;"
        );
    };
    const star = new Mesh(starGeometry, starMaterial);
    const glowMaterial = new ShaderMaterial({
      uniforms: { uSpread: { value: GLOW.spread }, uStrength: { value: GLOW.light } },
      vertexShader: GLOW_VERTEX,
      fragmentShader: GLOW_FRAGMENT,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: BackSide,
    });
    const glow = new Mesh(starGeometry, glowMaterial);
    glow.renderOrder = 1;


    // El radar se acuesta: su plano local X–Y pasa a ser el piso (X–Z del
    // mundo), su eje 0 apunta al fondo y su volumen queda vertical.
    const radar = new Group();
    radar.rotation.x = -Math.PI / 2;
    radar.add(...bands, ...rings, axes, activeAxis, star, glow, tip);

    const gridMaterial = new LineBasicMaterial();
    const walls = ([0, 1, 2] as const).map(
      (normal) =>
        new LineSegments(
          new BufferGeometry().setAttribute(
            "position",
            new BufferAttribute(planeGridPoints(normal), 3)
          ),
          gridMaterial
        )
    );
    scene.add(radar, ...walls);

    // Colores: la rampa de calor, la tinta y el fondo salen del tema. Las
    // líneas son opacas, con el color ya mezclado con el fondo.
    const readColor = createColorReader();
    const readVariable = (variable: string) =>
      readColor(getComputedStyle(wrapper).getPropertyValue(variable).trim());
    const ramp = new Float32Array(RAMP_STEPS * 3);
    const surface = new Color();
    const readColors = () => {
      const stops = HEAT_STOPS.map(([at, variable]) => {
        const [r, g, b] = readVariable(variable);
        return { at, color: new Color().setRGB(r, g, b, SRGBColorSpace) };
      });
      const sample = new Color();
      for (let step = 0; step < RAMP_STEPS; step++) {
        const t = step / (RAMP_STEPS - 1);
        sample.copy(stops[0].color);
        for (let i = 1; i < stops.length; i++) {
          const k = (t - stops[i - 1].at) / (stops[i].at - stops[i - 1].at);
          if (k > 0) sample.lerpColors(stops[i - 1].color, stops[i].color, Math.min(1, k));
        }
        ramp[step * 3] = sample.r;
        ramp[step * 3 + 1] = sample.g;
        ramp[step * 3 + 2] = sample.b;
      }
      // Fondo: el del primer ancestro opaco.
      let background: Rgba = readVariable("--background");
      for (let node: HTMLElement | null = wrapper; node; node = node.parentElement) {
        const color = readColor(getComputedStyle(node).backgroundColor);
        if (color[3] > 0.5) {
          background = color;
          break;
        }
      }
      surface.setRGB(background[0], background[1], background[2], SRGBColorSpace);
      scene.background = surface;
      const [ir, ig, ib] = readVariable("--foreground");
      const ink = new Color().setRGB(ir, ig, ib, SRGBColorSpace);
      const isDark = document.documentElement.classList.contains("dark");
      const mix = (alpha: number) => new Color().lerpColors(surface, ink, alpha);
      plateMaterials[0].color.copy(mix(isDark ? 0.05 : 0.025));
      plateMaterials[1].color.copy(mix(isDark ? 0.09 : 0.05));
      ringMaterial.color.copy(mix(0.16));
      rimMaterial.color.copy(mix(0.32));
      uniformMaterial.color.copy(mix(0.5));
      axisMaterial.color.copy(mix(0.45));
      activeMaterial.color.copy(mix(0.95));
      gridMaterial.color.copy(mix(isDark ? 0.16 : 0.1));
      tipMaterial.color.copy(ink);
      starUniforms.uGlow.value = isDark ? 0.12 : 0.05;
      glowMaterial.uniforms.uStrength.value = isDark ? GLOW.dark : GLOW.light;
    };
    readColors();

    const view = { ...VIEW };
    const levels = HEATMAP_AXES.map(() => 0);
    const projected = new Vector3();
    const origin = new Vector3();

    /* Reconstruye la estrella: posición, color de calor y normales. */
    const applyLevels = (next: number[]) => {
      next.forEach((level, index) => {
        levels[index] = level;
      });
      const positions = starGeometry.getAttribute("position") as BufferAttribute;
      const colors = starGeometry.getAttribute("color") as BufferAttribute;
      const heats = starGeometry.getAttribute("heat") as BufferAttribute;
      const position = positions.array as Float32Array;
      const color = colors.array as Float32Array;
      const heat = heats.array as Float32Array;
      for (let seg = 0; seg < ANGLES; seg++) {
        const theta = (seg / ANGLES) * Math.PI * 2;
        const edge = outline(theta, levels);
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const reach = Math.min(1, (edge - CORE) / (1 - CORE));
        const rimThickness = BODY.rim + BODY.rimGrowth * reach;
        for (let row = 0; row < ROWS; row++) {
          const latitude = -Math.PI / 2 + (row / LATITUDES) * Math.PI;
          const across = Math.cos(latitude);
          // El grosor pasa del borde (según la punta) al centro (fijo): en
          // los polos todos los ángulos llegan al mismo punto, sin pliegues.
          const thickness = BODY.pole + (rimThickness - BODY.pole) * across * across;
          const radius = edge * across;
          const vertex = row * ANGLES + seg;
          position[vertex * 3] = radius * cos;
          position[vertex * 3 + 1] = radius * sin;
          position[vertex * 3 + 2] = Math.sin(latitude) * thickness;
          const t = Math.min(1, Math.max(0, (radius - CORE) / (1 - CORE)));
          const step = Math.round(t * (RAMP_STEPS - 1)) * 3;
          color[vertex * 3] = ramp[step];
          color[vertex * 3 + 1] = ramp[step + 1];
          color[vertex * 3 + 2] = ramp[step + 2];
          heat[vertex] = t;
        }
      }
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      heats.needsUpdate = true;
      starGeometry.computeVertexNormals();
      // Los polos: una sola normal hacia arriba y hacia abajo.
      const normals = starGeometry.getAttribute("normal") as BufferAttribute;
      for (let seg = 0; seg < ANGLES; seg++) {
        normals.setXYZ(seg, 0, 0, -1);
        normals.setXYZ(LATITUDES * ANGLES + seg, 0, 0, 1);
      }
      normals.needsUpdate = true;
      starGeometry.computeBoundingSphere();
      refreshActive();
    };

    const refreshActive = () => {
      const index = activeRef.current;
      const angle = axisAngle(index);
      const length = outline(angle, levels);
      const points = activeAxis.geometry.getAttribute("position") as BufferAttribute;
      points.setXYZ(0, 0, 0, 0.002);
      points.setXYZ(1, Math.cos(angle) * AXIS_LENGTH, Math.sin(angle) * AXIS_LENGTH, 0.002);
      points.needsUpdate = true;
      activeAxis.geometry.computeBoundingSphere();
      tip.position.set(Math.cos(angle) * length, Math.sin(angle) * length, 0);
      invalidate();
    };

    /** Proyecta un punto del plano del radar a píxeles del contenedor. */
    const toScreen = (radius: number, angle: number, width: number, height: number) => {
      // Punto local (x, y, 0) del radar acostado = (x, 0, −y) del mundo.
      projected.set(Math.cos(angle) * radius, 0, -Math.sin(angle) * radius).project(camera);
      return [((projected.x + 1) / 2) * width, ((1 - projected.y) / 2) * height] as const;
    };

    const placeLabels = (width: number, height: number) => {
      origin.set(0, 0, 0).project(camera);
      const cx = ((origin.x + 1) / 2) * width;
      const cy = ((1 - origin.y) / 2) * height;
      HEATMAP_AXES.forEach((_, index) => {
        const element = labelRefs.current[index];
        if (!element) return;
        let [x, y] = toScreen(LABEL_RADIUS, axisAngle(index), width, height);
        // Empuja la etiqueta hacia afuera del radar según su dirección en pantalla.
        const ox = x - cx;
        const oy = y - cy;
        const length = Math.hypot(ox, oy) || 1;
        const halfWidth = element.offsetWidth / 2;
        const halfHeight = element.offsetHeight / 2;
        x += (ox / length) * halfWidth;
        y += (oy / length) * halfHeight;
        x = Math.min(width - halfWidth, Math.max(halfWidth, x));
        y = Math.min(height - halfHeight, Math.max(halfHeight, y));
        element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      });
      // Cifras de los anillos, entre el eje 0 y el 1 (como en el radar 2D).
      RING_TICKS.forEach(([ring], index) => {
        const element = tickRefs.current[index];
        if (!element) return;
        const [x, y] = toScreen(
          levelRadius(heatLevel(ring)) + 0.02,
          axisAngle(0) - AXIS_STEP / 2,
          width,
          height
        );
        element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      });
    };

    let frame = 0;
    let fit = 1;
    const render = () => {
      frame = 0;
      const distance = view.distance * fit;
      const { azimuth, elevation } = view;
      const flat = distance * Math.cos(elevation);
      camera.position.set(
        flat * Math.sin(azimuth),
        distance * Math.sin(elevation),
        flat * Math.cos(azimuth)
      );
      // El "arriba" de la cámara es la tangente del meridiano: no se
      // degenera al pasar justo encima o debajo del radar, así que la
      // elevación puede dar la vuelta completa.
      camera.up.set(
        -Math.sin(elevation) * Math.sin(azimuth),
        Math.cos(elevation),
        -Math.sin(elevation) * Math.cos(azimuth)
      );
      camera.lookAt(0, 0, 0);
      // Cada plano de la caja va a la cara lejana de la cámara.
      walls[0].position.x = camera.position.x > 0 ? -BOX_HALF[0] : BOX_HALF[0];
      walls[1].position.y = camera.position.y > 0 ? -BOX_HALF[1] : BOX_HALF[1];
      walls[2].position.z = camera.position.z > 0 ? -BOX_HALF[2] : BOX_HALF[2];
      renderer.render(scene, camera);
      placeLabels(wrapper.clientWidth, wrapper.clientHeight);
    };
    const invalidate = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    stateRef.current = { view, levels, invalidate, applyLevels, refreshActive };

    const resize = () => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // En cajas estrechas se aleja para que quepan las etiquetas.
      fit = Math.min(1.35, Math.max(1, 620 / width));
      camera.updateProjectionMatrix();
      invalidate();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrapper);
    resize();

    const themeObserver = new MutationObserver(() => {
      readColors();
      applyLevels([...levels]);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    /* Interacción: arrastre en dos ejes (con inercia), pinza, rueda con Ctrl/⌘. */
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const pointers = new Map<number, { x: number; y: number }>();
    const targets = [star, ...bands];
    let dragStart: { x: number; y: number } | null = null;
    let dragging = false;
    let lastMove = 0;
    let velocity = { azimuth: 0, elevation: 0 };
    let inertia = 0;
    let pinchStart: { gap: number; distance: number } | null = null;
    let lastPreview: number | null = null;

    const stopMotion = () => {
      cancelAnimationFrame(inertia);
      inertia = 0;
      cameraTween.current?.stop();
      cameraTween.current = null;
    };

    /** Eje más cercano al punto del radar bajo el puntero (estrella o plato). */
    const hitIndex = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(targets, false)[0];
      if (!hit) return null;
      // Del mundo al plano local del radar acostado: (x, −z).
      const angle = Math.atan2(-hit.point.z, hit.point.x);
      const steps = Math.round(wrapAngle(Math.PI / 2 - angle) / AXIS_STEP);
      return ((steps % AXIS_COUNT) + AXIS_COUNT) % AXIS_COUNT;
    };

    const preview = (index: number | null) => {
      if (index === lastPreview) return;
      lastPreview = index;
      callbacks.current.onPreview(index);
    };

    /* Sin topes: la elevación da la vuelta entera. Si la cámara pasó al
       otro lado (de cabeza), el giro horizontal se invierte para que el
       radar siga al dedo. */
    const turn = (azimuth: number, elevation: number) => {
      view.azimuth = wrapAngle(view.azimuth + azimuth);
      view.elevation = wrapAngle(view.elevation + elevation);
    };
    const upright = () => (Math.cos(view.elevation) >= 0 ? 1 : -1);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      stopMotion();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      wrapper.setPointerCapture(event.pointerId);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { gap: Math.hypot(a.x - b.x, a.y - b.y), distance: view.distance };
        dragStart = null;
        return;
      }
      dragStart = { x: event.clientX, y: event.clientY };
      dragging = false;
      velocity = { azimuth: 0, elevation: 0 };
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) {
        if (event.pointerType === "mouse") preview(hitIndex(event.clientX, event.clientY));
        return;
      }
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinchStart && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const gap = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        view.distance = Math.min(
          DISTANCE.max,
          Math.max(DISTANCE.min, pinchStart.distance * (pinchStart.gap / gap))
        );
        invalidate();
        return;
      }
      if (!dragStart) return;
      if (
        !dragging &&
        Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > DRAG_THRESHOLD
      ) {
        dragging = true;
        wrapper.dataset.dragging = "true";
        preview(null);
      }
      if (!dragging) return;
      // En táctil, un gesto que empieza vertical es del scroll de la página
      // (touch-pan-y); uno que empieza de lado gira en las dos direcciones.
      velocity = {
        azimuth: -(event.clientX - previous.x) * 0.008 * upright(),
        elevation: (event.clientY - previous.y) * 0.006,
      };
      lastMove = performance.now();
      turn(velocity.azimuth, velocity.elevation);
      invalidate();
    };

    const onPointerUp = (event: PointerEvent) => {
      const wasDragging = dragging;
      pointers.delete(event.pointerId);
      if (wrapper.hasPointerCapture(event.pointerId)) {
        wrapper.releasePointerCapture(event.pointerId);
      }
      if (pinchStart) {
        if (pointers.size < 2) pinchStart = null;
        return;
      }
      dragStart = null;
      dragging = false;
      delete wrapper.dataset.dragging;
      if (!wasDragging) {
        const index = hitIndex(event.clientX, event.clientY);
        if (index !== null) callbacks.current.onChoose(index);
        return;
      }
      if (reduceRef.current) return;
      // Si el puntero se quedó quieto antes de soltar, no hay impulso.
      if (performance.now() - lastMove > 90) return;
      const glide = () => {
        velocity = { azimuth: velocity.azimuth * 0.92, elevation: velocity.elevation * 0.92 };
        turn(velocity.azimuth, velocity.elevation);
        invalidate();
        const moving = Math.abs(velocity.azimuth) + Math.abs(velocity.elevation) > 0.0004;
        inertia = moving ? requestAnimationFrame(glide) : 0;
      };
      inertia = requestAnimationFrame(glide);
    };

    const onPointerLeave = () => {
      if (!dragStart) preview(null);
    };

    const onWheel = (event: WheelEvent) => {
      // Sin modificador la rueda es del scroll de la página.
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      stopMotion();
      view.distance = Math.min(
        DISTANCE.max,
        Math.max(DISTANCE.min, view.distance * Math.exp(event.deltaY * 0.004))
      );
      invalidate();
    };

    wrapper.addEventListener("pointerdown", onPointerDown);
    wrapper.addEventListener("pointermove", onPointerMove);
    wrapper.addEventListener("pointerup", onPointerUp);
    wrapper.addEventListener("pointercancel", onPointerUp);
    wrapper.addEventListener("pointerleave", onPointerLeave);
    wrapper.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      stopMotion();
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      wrapper.removeEventListener("pointerdown", onPointerDown);
      wrapper.removeEventListener("pointermove", onPointerMove);
      wrapper.removeEventListener("pointerup", onPointerUp);
      wrapper.removeEventListener("pointercancel", onPointerUp);
      wrapper.removeEventListener("pointerleave", onPointerLeave);
      wrapper.removeEventListener("wheel", onWheel);
      starGeometry.dispose();
      for (const object of [axes, activeAxis, tip, ...bands, ...rings, ...walls]) {
        object.geometry.dispose();
      }
      for (const material of [
        starMaterial,
        glowMaterial,
        tipMaterial,
        ...plateMaterials,
        ringMaterial,
        rimMaterial,
        uniformMaterial,
        axisMaterial,
        activeMaterial,
        gridMaterial,
      ]) {
        material.dispose();
      }
      environment.dispose();
      renderer.dispose();
      canvas.remove();
      stateRef.current = null;
    };
  }, []);

  /* Nueva distribución: las puntas crecen desde la forma vigente. */
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    const from = [...state.levels];
    const to = signature.split(" ").map(Number);
    if (reduce) {
      state.applyLevels(to);
      return;
    }
    const controls = animate(0, 1, {
      duration: 0.9,
      ease: EASE_OUT,
      onUpdate: (progress) =>
        state.applyLevels(from.map((level, index) => level + (to[index] - level) * progress)),
    });
    return () => controls.stop();
  }, [signature, reduce]);

  /* Eje activo: radio en tinta y punto en la punta. */
  useEffect(() => {
    stateRef.current?.refreshActive();
  }, [active]);

  function travel(target: Partial<SceneState["view"]>) {
    const state = stateRef.current;
    if (!state) return;
    cameraTween.current?.stop();
    const start = { ...state.view };
    const end = {
      azimuth: start.azimuth + wrapAngle((target.azimuth ?? start.azimuth) - start.azimuth),
      elevation:
        start.elevation + wrapAngle((target.elevation ?? start.elevation) - start.elevation),
      distance: target.distance ?? start.distance,
    };
    if (reduceRef.current) {
      Object.assign(state.view, end);
      state.invalidate();
      return;
    }
    cameraTween.current = animate(0, 1, {
      duration: 0.55,
      ease: EASE_IN_OUT,
      onUpdate: (p) => {
        state.view.azimuth = start.azimuth + (end.azimuth - start.azimuth) * p;
        state.view.elevation = start.elevation + (end.elevation - start.elevation) * p;
        state.view.distance = start.distance + (end.distance - start.distance) * p;
        state.invalidate();
      },
    });
  }

  const zoom = (factor: number) => {
    const state = stateRef.current;
    if (!state) return;
    travel({
      distance: Math.min(DISTANCE.max, Math.max(DISTANCE.min, state.view.distance * factor)),
    });
  };

  return (
    <div className="relative">
      <div
        ref={wrapperRef}
        className="relative aspect-[4/3] w-full cursor-grab touch-pan-y select-none data-[dragging=true]:cursor-grabbing @xl:aspect-[16/10]"
      >
        {RING_TICKS.map(([ring, text], index) => (
          <span
            key={ring}
            ref={(node) => {
              tickRefs.current[index] = node;
            }}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-[1] font-mono text-[9px] leading-none text-muted-foreground tabular-nums will-change-transform"
          >
            {text}
          </span>
        ))}
        {HEATMAP_AXES.map((ideologyClass, index) => (
          <div
            key={ideologyClass}
            ref={(node) => {
              labelRefs.current[index] = node;
            }}
            className="absolute left-0 top-0 z-[2] will-change-transform"
          >
            {renderLabel(index)}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] leading-4 text-muted-foreground">
          <span className="[@media(pointer:coarse)]:hidden">
            Arrastre en cualquier dirección para rodearlo · Ctrl o ⌘ + rueda para acercar
          </span>
          <span className="hidden [@media(pointer:coarse)]:inline">
            Deslice para girar · pellizque para acercar
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {[
            { label: "Acercar", icon: Plus, action: () => zoom(0.82) },
            { label: "Alejar", icon: Minus, action: () => zoom(1.22) },
            { label: "Restablecer la vista", icon: RotateCcw, action: () => travel(VIEW) },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={action}
              className="grid size-8 place-items-center border border-border text-muted-foreground outline-none transition-[color,scale] duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.96]"
            >
              <Icon aria-hidden className="size-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
