"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Scroll suave global (Lenis). Se desactiva por completo con
 * `prefers-reduced-motion` y se destruye al desmontar. `anchors` hace que
 * los enlaces #ancla de la landing hereden el mismo easing.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.12,
      anchors: { offset: -104 },
    });

    const stop = () => lenis.destroy();
    media.addEventListener("change", stop, { once: true });
    return () => {
      media.removeEventListener("change", stop);
      lenis.destroy();
    };
  }, []);

  return null;
}
