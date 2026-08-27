"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Transición de entrada entre rutas: fundido corto con deriva de 8px.
 * Solo entrada (App Router remonta el template por navegación) y solo
 * cuando el usuario no pide movimiento reducido.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
