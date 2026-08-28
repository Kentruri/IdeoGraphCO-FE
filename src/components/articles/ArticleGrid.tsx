"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ArticleCard } from "@/components/articles/ArticleCard";
import type { Article } from "@/types/article";

interface ArticleGridProps {
  articles: Article[];
}

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Grid de recortes: cada pieza se "imprime" al entrar en viewport
 * (clip-path de tinta + leve ascenso, escalonado por columna) y el
 * reordenamiento al filtrar es una animación de layout (FLIP), no un
 * re-render seco. Con reduced-motion todo aparece en su sitio.
 */
export function ArticleGrid({ articles }: ArticleGridProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      layout={!reduce}
      className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            layout={!reduce}
            initial={
              reduce
                ? false
                : { opacity: 0, y: 22, clipPath: "inset(0 100% 0 0)" }
            }
            whileInView={{ opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true, amount: 0.15, margin: "0px 0px -6% 0px" }}
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0.1 } }
                : {
                    opacity: 0,
                    scale: 0.96,
                    transition: { duration: 0.18, ease: EASE_EXPO },
                  }
            }
            transition={{
              duration: 0.55,
              ease: EASE_EXPO,
              delay: (index % 3) * 0.07,
              layout: { type: "spring", duration: 0.5, bounce: 0.12 },
            }}
            className="h-full"
          >
            <ArticleCard article={article} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
