"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { IDEOLOGY_DISPLAY_ORDER } from "@/types/ideology";

interface GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  radius: number;
  classIndex: number;
  phase: number;
  hub: boolean;
}

type Edge = [number, number];

const POINTER_RADIUS = 150;
const POINTER_FORCE = 900;
const SPRING = 3.2;
const DAMPING = 3.4;
const DRIFT_AMPLITUDE = 14;

/**
 * Grafo generativo de las 8 clases ideológicas: una constelación de nodos
 * por clase, ancladas en anillo y unidas por aristas; deriva orgánica y
 * repulsión al puntero. Es la materia visual del hero (docs/design-system.md §5.1).
 *
 * Rendimiento y respeto al usuario:
 * - un solo requestAnimationFrame con limpieza estricta;
 * - pausa cuando la pestaña se oculta o el canvas sale del viewport;
 * - DPR limitado a 2;
 * - con `prefers-reduced-motion` dibuja un único frame estático.
 */
export function IdeoGraphCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* Consts re-estrechados: las funciones internas se izan por encima del
       guard y TypeScript perdería el narrowing sobre los originales. */
    const canvasNullable = canvasRef.current;
    if (!canvasNullable) return;
    const canvas: HTMLCanvasElement = canvasNullable;
    const contextNullable = canvas.getContext("2d");
    if (!contextNullable) return;
    const context: CanvasRenderingContext2D = contextNullable;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: GraphNode[] = [];
    let edges: Edge[] = [];
    let colors: string[] = [];
    let edgeColor = "";
    let dark = false;

    let frame = 0;
    let running = false;
    let visible = true;
    let intersecting = true;
    let lastTime = 0;
    let elapsed = 0;
    const pointer = { x: -9999, y: -9999, active: false };

    function readColors() {
      const styles = getComputedStyle(document.documentElement);
      colors = IDEOLOGY_DISPLAY_ORDER.map((cls) =>
        styles.getPropertyValue(`--ideology-${cls}`).trim()
      );
      dark = document.documentElement.classList.contains("dark");
      edgeColor = dark ? "rgba(235, 233, 226, 0.14)" : "rgba(43, 40, 32, 0.12)";
    }

    function buildGraph() {
      const isNarrow = width < 720;
      const perClass = isNarrow ? 5 : 8;
      const centerX = width * (isNarrow ? 0.5 : 0.6);
      const centerY = height * 0.5;
      const ringX = Math.min(width * (isNarrow ? 0.4 : 0.3), 460);
      const ringY = height * 0.36;

      nodes = [];
      edges = [];

      IDEOLOGY_DISPLAY_ORDER.forEach((_, classIndex) => {
        const angle = (classIndex / 8) * Math.PI * 2 - Math.PI / 2;
        const anchorX = centerX + Math.cos(angle) * ringX;
        const anchorY = centerY + Math.sin(angle) * ringY;
        const base = nodes.length;

        for (let i = 0; i < perClass; i++) {
          const spreadAngle = Math.random() * Math.PI * 2;
          const spread = 14 + Math.random() * (isNarrow ? 44 : 64);
          const homeX = anchorX + Math.cos(spreadAngle) * spread;
          const homeY = anchorY + Math.sin(spreadAngle) * spread;
          nodes.push({
            x: homeX,
            y: homeY,
            vx: 0,
            vy: 0,
            homeX,
            homeY,
            radius: i === 0 ? 4.5 : 1.6 + Math.random() * 1.8,
            classIndex,
            phase: Math.random() * Math.PI * 2,
            hub: i === 0,
          });
          // Cadena intra-clase + retorno del último al hub.
          if (i > 0) edges.push([base + i - 1, base + i]);
          if (i === perClass - 1) edges.push([base + i, base]);
        }
      });

      // Aristas entre hubs de clases adyacentes en el anillo (el "grafo").
      const perClassCount = nodes.length / 8;
      for (let c = 0; c < 8; c++) {
        edges.push([c * perClassCount, ((c + 1) % 8) * perClassCount]);
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      buildGraph();
      if (reduced) renderStatic();
    }

    function step(dt: number, time: number) {
      for (const node of nodes) {
        // Deriva orgánica del punto de anclaje.
        const driftX =
          node.homeX + Math.sin(time * 0.4 + node.phase) * DRIFT_AMPLITUDE;
        const driftY =
          node.homeY +
          Math.cos(time * 0.32 + node.phase * 1.7) * DRIFT_AMPLITUDE;

        node.vx += (driftX - node.x) * SPRING * dt;
        node.vy += (driftY - node.y) * SPRING * dt;

        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < POINTER_RADIUS && distance > 0.5) {
            const force =
              ((1 - distance / POINTER_RADIUS) * POINTER_FORCE * dt) / distance;
            node.vx += dx * force;
            node.vy += dy * force;
          }
        }

        node.vx -= node.vx * DAMPING * dt;
        node.vy -= node.vy * DAMPING * dt;
        node.x += node.vx * dt * 60;
        node.y += node.vy * dt * 60;
      }
    }

    function render() {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      context.strokeStyle = edgeColor;
      context.lineWidth = 1;
      context.beginPath();
      for (const [a, b] of edges) {
        context.moveTo(nodes[a].x, nodes[a].y);
        context.lineTo(nodes[b].x, nodes[b].y);
      }
      context.stroke();

      for (const node of nodes) {
        context.fillStyle = colors[node.classIndex];
        if (dark) {
          context.shadowColor = colors[node.classIndex];
          context.shadowBlur = node.hub ? 14 : 6;
        }
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;
    }

    function renderStatic() {
      step(0, 0);
      render();
      setReady(true);
    }

    function loop(now: number) {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      elapsed += dt;
      step(dt, elapsed);
      render();
      frame = requestAnimationFrame(loop);
    }

    function syncRunning() {
      const shouldRun = !reduced && visible && intersecting;
      if (shouldRun && !running) {
        running = true;
        lastTime = performance.now();
        frame = requestAnimationFrame(loop);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(frame);
      }
    }

    readColors();
    resize();
    if (!reduced) {
      setReady(true);
      syncRunning();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        syncRunning();
      },
      { rootMargin: "80px" }
    );
    intersectionObserver.observe(canvas);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      syncRunning();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    // El puntero se escucha en la sección padre para que el texto del hero
    // no "apague" la interacción al pasar por encima.
    const surface = canvas.parentElement ?? canvas;
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerleave", onPointerLeave);

    const themeObserver = new MutationObserver(() => {
      readColors();
      if (reduced) renderStatic();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onMotionChange = (event: MediaQueryListEvent) => {
      reduced = event.matches;
      if (reduced) {
        syncRunning();
        renderStatic();
      } else {
        syncRunning();
      }
    };
    media.addEventListener("change", onMotionChange);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerleave", onPointerLeave);
      media.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "size-full transition-opacity duration-700 ease-out-expo",
        ready ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
}
