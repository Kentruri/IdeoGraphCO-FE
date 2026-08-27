"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

interface CountUpProps {
  /** Valor final (p. ej. 0.62 para 62 %). */
  value: number;
  /** Convierte el valor en texto (formatConfidence, etc.). */
  format: (value: number) => string;
  className?: string;
}

/**
 * Cifra que "asienta" como aguja de instrumento: cuenta de 0 al valor con
 * ease-out-expo en 600ms. Con reduced-motion muestra el valor directo.
 */
export function CountUp({ value, format, className }: CountUpProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{format(display)}</span>;
}
