"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

import {
  AXIS_COUNT,
  AXIS_STEP,
  EASE_IN_OUT,
  EASE_OUT,
  HEAT_STOPS,
  HEATMAP_AXES,
  heatLevel,
  ISO_LEVELS,
} from "@/lib/heatmap";
import { cn } from "@/lib/utils";
import type { IdeologyDistribution } from "@/types/ideology";

export interface TerrainProps {
  probabilities: IdeologyDistribution;
  /** Eje que se lee ahora (puntero o foco). */
  active: number;
  /** Eje fijado: la cámara viaja hasta quedar frente a su colina. */
  focus: number;
  onPreview: (index: number | null) => void;
  onChoose: (index: number) => void;
  /** Botón accesible de cada eje (lo dibuja el contenedor). */
  renderLabel: (index: number) => ReactNode;
  /** Sin WebGL: el contenedor cae al mapa 2D. */
  onUnsupported: () => void;
}

/* Geometría del relieve (unidades de mundo; el borde del disco mide 1). */
const PEAK_RADIUS = 0.56;
const SIGMA_RADIAL = 0.2;
const SIGMA_TANGENT = 0.125;
const HEIGHT = 0.68;
const RINGS = 72;
const SEGMENTS = 192; // múltiplo de 8: hay vértices justo sobre cada eje
const LABEL_RADIUS = 1.13;
const PIN_LENGTH = 0.2;
const TARGET_Y = 0.14;

/* Cámara: ángulo polar desde la vertical y distancia al centro. */
const POLAR = { initial: 1.02, min: 0.28, max: 1.34 };
const DISTANCE = { initial: 4.1, min: 2.6, max: 6 };
/** Giro extra al encarar una clase, para verla con algo de perspectiva. */
const FACE_OFFSET = 0.32;
const DRAG_THRESHOLD = 4;

const VERTEX_SHADER = /* glsl */ `
attribute float aHeat;
varying float vHeat;
varying vec3 vPos;
varying vec3 vNormal;

void main() {
  vHeat = aHeat;
  vPos = position;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uHeat[5];
uniform float uStops[5];
uniform float uIso[4];
uniform vec3 uInk;
uniform float uInkAlpha;
uniform vec3 uLight;
uniform float uActive;
varying float vHeat;
varying vec3 vPos;
varying vec3 vNormal;

const float STEP = ${AXIS_STEP.toFixed(6)};

vec3 ramp(float t) {
  vec3 c = uHeat[0];
  for (int i = 1; i < 5; i++) {
    float k = clamp((t - uStops[i - 1]) / (uStops[i] - uStops[i - 1]), 0.0, 1.0);
    c = mix(c, uHeat[i], k);
  }
  return c;
}

float band(float v, float level, float width) {
  float w = max(fwidth(v) * width, 1e-4);
  return 1.0 - smoothstep(0.0, w, abs(v - level));
}

void main() {
  float t = clamp(vHeat, 0.0, 1.0);
  vec3 color = ramp(t);
  float light = 0.64 + 0.42 * max(dot(normalize(vNormal), normalize(uLight)), 0.0);
  color *= light;

  // Isotermas: las mismas probabilidades que la leyenda (5, 12,5, 25, 50 %).
  float iso = 0.0;
  for (int i = 0; i < 4; i++) {
    iso = max(iso, band(t, uIso[i], 1.25));
  }

  // Retícula polar: dos anillos y los 8 ejes; el eje activo, en tinta plena.
  float r = length(vPos.xz);
  float angle = atan(vPos.x, -vPos.z);
  float k = floor(angle / STEP + 0.5);
  float spokeDist = r * abs(sin(angle - k * STEP));
  float spoke = (1.0 - smoothstep(0.0, max(fwidth(spokeDist) * 1.1, 1e-4), spokeDist))
    * smoothstep(0.03, 0.1, r);
  float isActive = 1.0 - step(0.5, abs(mod(k + 8.0, 8.0) - uActive));
  float ring = max(band(r, 1.0 / 3.0, 1.0), band(r, 2.0 / 3.0, 1.0));
  float grid = max(ring * 0.4, spoke * mix(0.38, 1.0, isActive));

  color = mix(color, uInk, max(iso * 0.7, grid) * uInkAlpha);
  gl_FragColor = vec4(color, 1.0);
}
`;

type Rgb = [number, number, number];

/** Convierte cualquier color CSS (oklch incluido) a sRGB en [0, 1]. */
function createColorReader() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return (element: Element, variable: string): Rgb => {
    const value = getComputedStyle(element).getPropertyValue(variable).trim();
    if (!ctx || !value) return [0.5, 0.5, 0.5];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#808080";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };
}

function axisDirection(index: number): [number, number] {
  const angle = index * AXIS_STEP;
  return [Math.sin(angle), -Math.cos(angle)];
}

/** Malla polar con los pesos gaussianos de cada colina precalculados. */
function buildTerrain() {
  const count = (RINGS + 1) * SEGMENTS;
  const positions = new Float32Array(count * 3);
  const heat = new Float32Array(count);
  const weights = new Float32Array(count * AXIS_COUNT);
  const axes = HEATMAP_AXES.map((_, index) => index * AXIS_STEP);

  for (let ring = 0; ring <= RINGS; ring++) {
    const radius = ring / RINGS;
    for (let seg = 0; seg < SEGMENTS; seg++) {
      const angle = (seg / SEGMENTS) * Math.PI * 2;
      const x = radius * Math.sin(angle);
      const z = -radius * Math.cos(angle);
      const vertex = ring * SEGMENTS + seg;
      positions[vertex * 3] = x;
      positions[vertex * 3 + 2] = z;
      axes.forEach((axisAngle, axis) => {
        const along = x * Math.sin(axisAngle) - z * Math.cos(axisAngle) - PEAK_RADIUS;
        const across = x * Math.cos(axisAngle) + z * Math.sin(axisAngle);
        weights[vertex * AXIS_COUNT + axis] = Math.exp(
          -(
            (along * along) / (2 * SIGMA_RADIAL * SIGMA_RADIAL) +
            (across * across) / (2 * SIGMA_TANGENT * SIGMA_TANGENT)
          )
        );
      });
    }
  }

  const indices = new Uint32Array(RINGS * SEGMENTS * 6);
  let cursor = 0;
  for (let ring = 0; ring < RINGS; ring++) {
    for (let seg = 0; seg < SEGMENTS; seg++) {
      const next = (seg + 1) % SEGMENTS;
      const a = ring * SEGMENTS + seg;
      const b = ring * SEGMENTS + next;
      const c = (ring + 1) * SEGMENTS + seg;
      const d = (ring + 1) * SEGMENTS + next;
      // Orden antihorario visto desde arriba: normales hacia +Y.
      indices.set([a, b, c, b, d, c], cursor);
      cursor += 6;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aHeat", new BufferAttribute(heat, 1));
  geometry.setIndex(new BufferAttribute(indices, 1));
  return { geometry, positions, heat, weights, count };
}

function circlePoints(radius: number, steps: number, y = 0.002) {
  const points: Vector3[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    points.push(new Vector3(radius * Math.sin(angle), y, -radius * Math.cos(angle)));
  }
  return points;
}

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function faceAzimuth(index: number) {
  return -index * AXIS_STEP + FACE_OFFSET;
}

interface SceneState {
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  material: ShaderMaterial;
  mesh: Mesh;
  pin: Line;
  pinHead: Mesh;
  inkMaterials: LineBasicMaterial[];
  pinHeadMaterial: MeshBasicMaterial;
  terrain: ReturnType<typeof buildTerrain>;
  view: { azimuth: number; polar: number; distance: number };
  amps: number[];
  invalidate: () => void;
  applyHeights: (amps: number[]) => void;
  refreshActive: () => void;
  readColors: () => void;
}

/**
 * Relieve 3D de la distribución: una colina por clase sobre su eje, con la
 * opuesta enfrente. Altura y color = nivel de calor (raíz de la
 * probabilidad), así que la cima de cada colina coincide con la leyenda.
 *
 * Recorrido: arrastrar gira la cámara (con inercia), Ctrl/⌘ + rueda o pinza
 * acercan, y fijar una clase (clic, flechas) lleva la cámara hasta ella.
 * Se dibuja bajo demanda: sin movimiento no hay frames.
 */
export default function IdeologyTerrain({
  probabilities,
  active,
  focus,
  onPreview,
  onChoose,
  renderLabel,
  onUnsupported,
}: TerrainProps) {
  const reduce = useReducedMotion() ?? false;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stateRef = useRef<SceneState | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const callbacks = useRef({ onPreview, onChoose, onUnsupported });
  callbacks.current = { onPreview, onChoose, onUnsupported };
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const cameraTween = useRef<AnimationPlaybackControls | null>(null);
  const focusRef = useRef(focus);

  const targetAmps = HEATMAP_AXES.map((ideologyClass) =>
    heatLevel(probabilities[ideologyClass])
  );
  const signature = targetAmps.map((amp) => amp.toFixed(4)).join(" ");

  /* Escena: se crea una vez y se libera al desmontar. */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      callbacks.current.onUnsupported();
      return;
    }
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "absolute inset-0 size-full";
    wrapper.prepend(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 50);
    const terrain = buildTerrain();

    const material = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uHeat: { value: HEAT_STOPS.map(() => new Vector3()) },
        uStops: { value: HEAT_STOPS.map(([stop]) => stop) },
        uIso: { value: ISO_LEVELS.map((level) => heatLevel(level)) },
        uInk: { value: new Vector3() },
        uInkAlpha: { value: 0.55 },
        uLight: { value: new Vector3(-0.45, 1, 0.55).normalize() },
        uActive: { value: activeRef.current },
      },
    });
    const mesh = new Mesh(terrain.geometry, material);
    scene.add(mesh);

    // Borde del disco, marcas de los ejes y alfiler de la clase activa.
    const rimMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.55 });
    const rim = new LineLoop(new BufferGeometry().setFromPoints(circlePoints(1, 192)), rimMaterial);
    const tickMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.55 });
    const tickPoints: Vector3[] = [];
    HEATMAP_AXES.forEach((_, index) => {
      const [dx, dz] = axisDirection(index);
      tickPoints.push(new Vector3(dx, 0.002, dz), new Vector3(dx * 1.06, 0.002, dz * 1.06));
    });
    const ticks = new LineSegments(new BufferGeometry().setFromPoints(tickPoints), tickMaterial);
    const pinMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.9 });
    const pin = new Line(
      new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]),
      pinMaterial
    );
    const pinHeadMaterial = new MeshBasicMaterial();
    const pinHead = new Mesh(new SphereGeometry(0.022, 16, 12), pinHeadMaterial);
    scene.add(rim, ticks, pin, pinHead);

    const readColor = createColorReader();
    const readColors = () => {
      const heat = material.uniforms.uHeat.value as Vector3[];
      HEAT_STOPS.forEach(([, variable], index) => {
        heat[index].set(...readColor(wrapper, variable));
      });
      const ink = readColor(wrapper, "--foreground");
      (material.uniforms.uInk.value as Vector3).set(...ink);
      const isDark = document.documentElement.classList.contains("dark");
      material.uniforms.uInkAlpha.value = isDark ? 0.42 : 0.5;
      const inkColor = new Color().setRGB(...ink, SRGBColorSpace);
      for (const lineMaterial of [rimMaterial, tickMaterial, pinMaterial]) {
        lineMaterial.color.copy(inkColor);
      }
      pinHeadMaterial.color.copy(inkColor);
    };
    readColors();

    const view = {
      azimuth: faceAzimuth(focusRef.current),
      polar: POLAR.initial,
      distance: DISTANCE.initial,
    };
    const amps = HEATMAP_AXES.map(() => 0);
    const projected = new Vector3();
    const origin = new Vector3();

    const placeLabels = (width: number, height: number) => {
      origin.set(0, 0, 0).project(camera);
      const cx = ((origin.x + 1) / 2) * width;
      const cy = ((1 - origin.y) / 2) * height;
      // Dirección horizontal de la cámara: las etiquetas del fondo se elevan
      // por encima de su colina para que el relieve no las tape.
      const camX = Math.sin(view.azimuth);
      const camZ = Math.cos(view.azimuth);
      HEATMAP_AXES.forEach((_, index) => {
        const element = labelRefs.current[index];
        if (!element) return;
        const [dx, dz] = axisDirection(index);
        const back = Math.max(0, -(dx * camX + dz * camZ));
        const neighbours = Math.max(
          amps[(index + 1) % AXIS_COUNT],
          amps[(index + AXIS_COUNT - 1) % AXIS_COUNT]
        );
        const lift = back * (Math.max(amps[index], neighbours * 0.7) * HEIGHT + 0.04);
        projected.set(dx * LABEL_RADIUS, lift, dz * LABEL_RADIUS).project(camera);
        let x = ((projected.x + 1) / 2) * width;
        let y = ((1 - projected.y) / 2) * height;
        // Empuja la etiqueta hacia afuera del disco según su dirección en pantalla.
        const ox = x - cx;
        const oy = y - cy;
        const length = Math.hypot(ox, oy) || 1;
        const halfWidth = element.offsetWidth / 2;
        const halfHeight = element.offsetHeight / 2;
        x += (ox / length) * halfWidth;
        y += (oy / length) * halfHeight;
        // Nunca fuera de la caja (en móvil la caja es justa).
        x = Math.min(width - halfWidth, Math.max(halfWidth, x));
        element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        element.style.zIndex = back > 0 ? "1" : "2";
      });
    };

    let frame = 0;
    /** Factor de encuadre: en cajas estrechas la cámara se aleja. */
    let fit = 1;
    const render = () => {
      frame = 0;
      const { azimuth, polar } = view;
      const distance = view.distance * fit;
      camera.position.set(
        distance * Math.sin(polar) * Math.sin(azimuth),
        TARGET_Y + distance * Math.cos(polar),
        distance * Math.sin(polar) * Math.cos(azimuth)
      );
      camera.lookAt(0, TARGET_Y, 0);
      renderer.render(scene, camera);
      placeLabels(wrapper.clientWidth, wrapper.clientHeight);
    };
    const invalidate = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const placePin = () => {
      const index = activeRef.current;
      const [dx, dz] = axisDirection(index);
      const top = amps[index] * HEIGHT;
      const positions = pin.geometry.getAttribute("position") as BufferAttribute;
      positions.setXYZ(0, dx * PEAK_RADIUS, top, dz * PEAK_RADIUS);
      positions.setXYZ(1, dx * PEAK_RADIUS, top + PIN_LENGTH, dz * PEAK_RADIUS);
      positions.needsUpdate = true;
      pin.geometry.computeBoundingSphere();
      pinHead.position.set(dx * PEAK_RADIUS, top + PIN_LENGTH, dz * PEAK_RADIUS);
      material.uniforms.uActive.value = index;
    };

    const applyHeights = (next: number[]) => {
      next.forEach((amp, index) => {
        amps[index] = amp;
      });
      const { positions, heat, weights, count } = terrain;
      for (let vertex = 0; vertex < count; vertex++) {
        let level = 0;
        for (let axis = 0; axis < AXIS_COUNT; axis++) {
          level += amps[axis] * weights[vertex * AXIS_COUNT + axis];
        }
        heat[vertex] = level;
        positions[vertex * 3 + 1] = level * HEIGHT;
      }
      terrain.geometry.getAttribute("position").needsUpdate = true;
      terrain.geometry.getAttribute("aHeat").needsUpdate = true;
      terrain.geometry.computeVertexNormals();
      terrain.geometry.computeBoundingSphere();
      placePin();
      invalidate();
    };
    applyHeights(amps);

    stateRef.current = {
      renderer,
      camera,
      material,
      mesh,
      pin,
      pinHead,
      inkMaterials: [rimMaterial, tickMaterial, pinMaterial],
      pinHeadMaterial,
      terrain,
      view,
      amps,
      invalidate,
      applyHeights,
      refreshActive: () => {
        placePin();
        invalidate();
      },
      readColors,
    };

    // Tamaño: el lienzo sigue a su caja.
    const resize = () => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // En cajas estrechas se aleja para que quepan las etiquetas.
      fit = Math.min(1.22, Math.max(1, 560 / width));
      camera.updateProjectionMatrix();
      invalidate();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrapper);
    resize();

    // Tema: se releen los tokens al cambiar claro/oscuro.
    const themeObserver = new MutationObserver(() => {
      readColors();
      invalidate();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    /* Interacción: arrastre (giro + inercia), pinza, rueda con Ctrl/⌘. */
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const pointers = new Map<number, { x: number; y: number }>();
    let dragStart: { x: number; y: number } | null = null;
    let dragging = false;
    let velocity = 0;
    let inertia = 0;
    let pinchStart: { gap: number; distance: number } | null = null;
    let lastPreview: number | null = null;

    const stopMotion = () => {
      cancelAnimationFrame(inertia);
      inertia = 0;
      cameraTween.current?.stop();
      cameraTween.current = null;
    };

    const hitIndex = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(mesh, false)[0];
      if (!hit) return null;
      const { x, z } = hit.point;
      if (Math.hypot(x, z) > 1.02) return null;
      const angle = Math.atan2(x, -z);
      return ((Math.round(angle / AXIS_STEP) % AXIS_COUNT) + AXIS_COUNT) % AXIS_COUNT;
    };

    const preview = (index: number | null) => {
      if (index === lastPreview) return;
      lastPreview = index;
      callbacks.current.onPreview(index);
    };

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
      velocity = 0;
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
      if (!dragging && Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > DRAG_THRESHOLD) {
        dragging = true;
        wrapper.dataset.dragging = "true";
        preview(null);
      }
      if (!dragging) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      velocity = -dx * 0.009;
      view.azimuth += velocity;
      // En táctil el gesto vertical es del scroll de la página.
      if (event.pointerType !== "touch") {
        view.polar = Math.min(POLAR.max, Math.max(POLAR.min, view.polar - dy * 0.006));
      }
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
      if (reduceRef.current || Math.abs(velocity) < 0.002) return;
      const glide = () => {
        velocity *= 0.92;
        view.azimuth += velocity;
        invalidate();
        inertia = Math.abs(velocity) > 0.0004 ? requestAnimationFrame(glide) : 0;
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
      terrain.geometry.dispose();
      material.dispose();
      for (const object of [rim, ticks, pin]) object.geometry.dispose();
      for (const lineMaterial of [rimMaterial, tickMaterial, pinMaterial]) lineMaterial.dispose();
      pinHead.geometry.dispose();
      pinHeadMaterial.dispose();
      renderer.dispose();
      canvas.remove();
      stateRef.current = null;
    };
  }, []);

  /* Nueva distribución: las colinas crecen desde la forma vigente. */
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    const from = [...state.amps];
    const to = signature.split(" ").map(Number);
    if (reduce) {
      state.applyHeights(to);
      return;
    }
    const controls = animate(0, 1, {
      duration: 0.9,
      ease: EASE_OUT,
      onUpdate: (progress) =>
        state.applyHeights(from.map((amp, index) => amp + (to[index] - amp) * progress)),
    });
    return () => controls.stop();
  }, [signature, reduce]);

  /* Eje activo: alfiler, eje en tinta y cifra sobre la cima. */
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    state.refreshActive();
  }, [active]);

  /* Clase fijada: la cámara viaja hasta encararla. */
  useEffect(() => {
    focusRef.current = focus;
    const state = stateRef.current;
    if (!state) return;
    travelTo(state, faceAzimuth(focus), null, null);
    // travelTo solo usa refs y el estado de la escena.
  }, [focus]);

  function travelTo(
    state: SceneState,
    azimuth: number,
    polar: number | null,
    distance: number | null
  ) {
    cameraTween.current?.stop();
    const start = { ...state.view };
    const delta = wrapAngle(azimuth - start.azimuth);
    const end = {
      azimuth: start.azimuth + delta,
      polar: polar ?? start.polar,
      distance: distance ?? start.distance,
    };
    if (reduceRef.current) {
      Object.assign(state.view, end);
      state.invalidate();
      return;
    }
    cameraTween.current = animate(0, 1, {
      duration: 0.6,
      ease: EASE_IN_OUT,
      onUpdate: (progress) => {
        state.view.azimuth = start.azimuth + (end.azimuth - start.azimuth) * progress;
        state.view.polar = start.polar + (end.polar - start.polar) * progress;
        state.view.distance = start.distance + (end.distance - start.distance) * progress;
        state.invalidate();
      },
    });
  }

  const zoom = (factor: number) => {
    const state = stateRef.current;
    if (!state) return;
    const distance = Math.min(
      DISTANCE.max,
      Math.max(DISTANCE.min, state.view.distance * factor)
    );
    travelTo(state, state.view.azimuth, null, distance);
  };

  const resetView = () => {
    const state = stateRef.current;
    if (!state) return;
    travelTo(state, faceAzimuth(focus), POLAR.initial, DISTANCE.initial);
  };


  return (
    <div className="relative">
      <div
        ref={wrapperRef}
        className="relative aspect-[4/3] w-full cursor-grab touch-pan-y select-none data-[dragging=true]:cursor-grabbing @xl:aspect-[16/10]"
      >
        {HEATMAP_AXES.map((ideologyClass, index) => (
          <div
            key={ideologyClass}
            ref={(node) => {
              labelRefs.current[index] = node;
            }}
            className="absolute left-0 top-0 will-change-transform"
          >
            {renderLabel(index)}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] leading-4 text-muted-foreground">
          <span className="[@media(pointer:coarse)]:hidden">
            Arrastre para girar · Ctrl o ⌘ + rueda para acercar
          </span>
          <span className="hidden [@media(pointer:coarse)]:inline">
            Deslice para girar · pellizque para acercar
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {[
            { label: "Acercar", icon: Plus, action: () => zoom(0.82) },
            { label: "Alejar", icon: Minus, action: () => zoom(1.22) },
            { label: "Restablecer la vista", icon: RotateCcw, action: resetView },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={action}
              className={cn(
                "grid size-8 place-items-center border border-border text-muted-foreground outline-none transition-[color,scale] duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 active:scale-[0.96]"
              )}
            >
              <Icon aria-hidden className="size-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
