"use client";

import { motion, useReducedMotion } from "motion/react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Retardo en segundos (para cascadas cortas entre hermanos). */
  delay?: number;
  /** Desplazamiento vertical de entrada, en px. */
  distance?: number;
}

/**
 * Entrada al entrar en viewport: opacidad + traslación corta con
 * ease-out-expo. Con reduced-motion no hay estado inicial oculto.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
}: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
