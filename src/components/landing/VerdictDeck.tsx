"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

import { IdeologyBadge } from "@/components/ideology/IdeologyBadge";
import { IdeologyStrip } from "@/components/ideology/IdeologyStrip";
import { TapeSkeleton } from "@/components/skeletons/ArticleCardSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPublishedAt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetArticlesQuery } from "@/store/services/articles.api";
import type { IdeologyClass, IdeologyDistribution } from "@/types/ideology";

interface DeckCard {
  headline: string;
  subtitle?: string;
  source: string;
  when: string;
  readingMinutes?: number;
  predicted: IdeologyClass;
  distribution: IdeologyDistribution;
  /** Slug real del corpus; sin él, la tarjeta no ofrece lectura. */
  slug?: string;
}

/** Respaldo si la API falla: mediciones ilustrativas (sin enlace). */
const FALLBACK_CARDS: DeckCard[] = [
  {
    headline: "La reforma pensional entra en su semana decisiva",
    source: "El Faro Nacional",
    when: "hace 2 horas",
    predicted: "progresismo",
    distribution: {
      progresismo: 0.41,
      institucionalismo: 0.15,
      globalismo: 0.12,
      populismo: 0.09,
      doctrinarismo: 0.08,
      personalismo: 0.06,
      conservadurismo: 0.05,
      soberanismo: 0.04,
    },
  },
  {
    headline: "Las cortes frenan el decreto de emergencia económica",
    source: "Vigía Judicial",
    when: "ayer",
    predicted: "institucionalismo",
    distribution: {
      institucionalismo: 0.54,
      doctrinarismo: 0.12,
      conservadurismo: 0.09,
      progresismo: 0.07,
      globalismo: 0.06,
      personalismo: 0.05,
      populismo: 0.04,
      soberanismo: 0.03,
    },
  },
  {
    headline: "El agro pide blindar la producción nacional",
    source: "Correo del Magdalena",
    when: "hace 5 horas",
    predicted: "soberanismo",
    distribution: {
      soberanismo: 0.38,
      populismo: 0.17,
      conservadurismo: 0.13,
      personalismo: 0.09,
      doctrinarismo: 0.08,
      institucionalismo: 0.06,
      progresismo: 0.05,
      globalismo: 0.04,
    },
  },
];

/** Pose de cada puesto de la pila (profundidad real con translateZ). */
const SLOT_POSE = [
  { y: 0, z: 0, rotateZ: 0, scale: 1 },
  { y: 22, z: -46, rotateZ: 1.7, scale: 0.985 },
  { y: 44, z: -92, rotateZ: -1.5, scale: 0.97 },
  { y: 66, z: -138, rotateZ: 1.2, scale: 0.955 },
];

const BASE_TILT_X = 10;
const TILT_RANGE_X = 7;
const TILT_RANGE_Y = 10;
const SHUFFLE_INTERVAL = 3200;

/**
 * La pila de veredictos: los primeros recortes reales del corpus, apilados
 * en 3D con los materiales del sistema. Se baraja sola (la tarjeta frontal
 * se levanta, pasa por delante y se archiva al fondo), el cursor inclina
 * la pila, el hover la pausa, la tarjeta frontal enlaza a su noticia y un
 * control aparte pasa a la siguiente. Con reduced-motion queda abanicada
 * y estática; los cambios son en seco.
 */
export function VerdictDeck({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isError } = useGetArticlesQuery({ page: 1, pageSize: 4 });
  const cards: DeckCard[] | null = data
    ? data.items.slice(0, 4).map((article) => ({
        headline: article.title,
        subtitle: article.subtitle,
        source: article.source.name,
        when: formatPublishedAt(article.publishedAt),
        readingMinutes: article.readingTimeMinutes,
        predicted: article.ideology.predicted,
        distribution: article.ideology.probabilities,
        slug: article.slug,
      }))
    : isError
      ? FALLBACK_CARDS
      : null;

  const [order, setOrder] = useState<number[]>([]);
  const [lastArchived, setLastArchived] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const cardCount = cards?.length ?? 0;

  useEffect(() => {
    setOrder(Array.from({ length: cardCount }, (_, index) => index));
  }, [cardCount]);

  const advance = useCallback(() => {
    setOrder((current) => {
      if (current.length < 2) return current;
      setLastArchived(current[0]);
      return [...current.slice(1), current[0]];
    });
  }, []);

  /* Barajado automático, pausado en hover/foco y con la pestaña oculta. */
  useEffect(() => {
    if (reduce || paused || cardCount < 2) return;
    const id = setInterval(() => {
      if (!document.hidden) advance();
    }, SHUFFLE_INTERVAL);
    return () => clearInterval(id);
  }, [reduce, paused, cardCount, advance]);

  /* Tilt de la pila hacia el cursor. */
  const tiltX = useMotionValue(BASE_TILT_X);
  const tiltY = useMotionValue(0);
  const springTiltX = useSpring(tiltX, { stiffness: 70, damping: 16 });
  const springTiltY = useSpring(tiltY, { stiffness: 70, damping: 16 });

  useEffect(() => {
    if (reduce) return;
    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = Math.max(
        -1,
        Math.min(1, (event.clientX - (rect.left + rect.width / 2)) / rect.width)
      );
      const ny = Math.max(
        -1,
        Math.min(1, (event.clientY - (rect.top + rect.height / 2)) / rect.height)
      );
      tiltX.set(BASE_TILT_X - ny * TILT_RANGE_X);
      tiltY.set(nx * TILT_RANGE_Y);
    };
    const onPointerLeave = () => {
      tiltX.set(BASE_TILT_X);
      tiltY.set(0);
    };

    // La sección entera alimenta el gesto.
    const surface = container.closest("section") ?? container;
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerleave", onPointerLeave);
    return () => {
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reduce, tiltX, tiltY]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="perspective-distant transform-3d relative mx-auto w-[min(100%,23rem)] pb-20 pt-6">
        <motion.div
          className="transform-3d relative"
          style={
            reduce
              ? { transform: `rotateX(${BASE_TILT_X}deg)` }
              : { rotateX: springTiltX, rotateY: springTiltY }
          }
        >
          {/* Referencia de altura: una tarjeta invisible define el alto real
              (sin enlace, para no introducir paradas de tabulación ocultas). */}
          <div className="invisible" aria-hidden>
            {cards ? (
              <DeckCardBody card={cards[0]} front={false} />
            ) : (
              <DeckCardSkeleton />
            )}
          </div>

          {!cards && (
            /* Carga: la pila en reposo, como placeholders de prensa. */
            <>
              {[0, 1, 2].map((slot) => (
                <div
                  key={slot}
                  aria-hidden
                  className="absolute inset-x-0 top-0 bg-card ring-1 ring-border"
                  style={{
                    transform: `translateY(${SLOT_POSE[slot].y}px) translateZ(${SLOT_POSE[slot].z}px) rotate(${SLOT_POSE[slot].rotateZ}deg) scale(${SLOT_POSE[slot].scale})`,
                    opacity: 1 - slot * 0.18,
                  }}
                >
                  {slot === 0 && <DeckCardSkeleton />}
                </div>
              ))}
            </>
          )}

          {cards?.map((card, cardIndex) => {
            const slot = order.indexOf(cardIndex);
            if (slot === -1) return null;
            const pose = SLOT_POSE[Math.min(slot, SLOT_POSE.length - 1)];
            const front = slot === 0;
            const archiving =
              !reduce && slot === cardCount - 1 && lastArchived === cardIndex;

            return (
              <motion.div
                key={card.headline}
                initial={false}
                animate={
                  archiving
                    ? {
                        /* Arco de archivado: se levanta, pasa por delante
                           y se guarda al fondo de la pila. */
                        y: [null, -70, pose.y],
                        z: [null, 66, pose.z],
                        rotateZ: [null, -3.5, pose.rotateZ],
                        scale: [null, 1.02, pose.scale],
                        filter: [null, "blur(0px)", `blur(${slot * 0.5}px)`],
                      }
                    : { ...pose, filter: `blur(${slot * 0.5}px)` }
                }
                whileHover={
                  front && !reduce
                    ? { y: pose.y - 7, scale: 1.015, filter: "blur(0px)" }
                    : undefined
                }
                onAnimationComplete={
                  archiving ? () => setLastArchived(null) : undefined
                }
                transition={
                  reduce
                    ? { duration: 0 }
                    : archiving
                      ? { duration: 0.62, ease: [0.45, 0, 0.2, 1] }
                      : { type: "spring", duration: 0.55, bounce: 0.15 }
                }
                className={cn(
                  "absolute inset-x-0 top-0",
                  front ? "" : "pointer-events-none"
                )}
              >
                {/* Superficie = pasar recorte (conveniencia de puntero: el
                    teclado tiene el chevron y el enlace); el enlace "Leer"
                    navega y corta la propagación. */}
                <div
                  aria-hidden={front ? undefined : true}
                  onClick={front && cardCount > 1 ? advance : undefined}
                  className={cn(
                    "group relative bg-card ring-1 ring-border transition-shadow duration-200 ease-out-expo",
                    front &&
                      "cursor-pointer shadow-lg shadow-foreground/15 hover:shadow-xl hover:shadow-foreground/20"
                  )}
                >
                  <DeckCardBody card={card} front={front} />
                  {/* Velo de profundidad: el papel se apaga hacia el fondo. */}
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-background"
                    initial={false}
                    animate={{ opacity: slot * 0.18 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.4 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Sombra de objeto sobre la mesa. */}
      <div
        aria-hidden
        className="absolute inset-x-[16%] bottom-14 h-5 rounded-[50%] bg-foreground/15 blur-lg"
      />

      {/* Folio de la pila: posición + pasar recorte. */}
      <div className="relative flex items-center justify-center gap-3">
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {cardCount > 0 ? `${(order[0] ?? 0) + 1} / ${cardCount}` : "– / –"}
        </p>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Pasar al siguiente recorte"
          disabled={cardCount < 2}
          onClick={advance}
        >
          <ChevronRight className="size-4 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:group-hover/button:translate-x-0.5" />
        </Button>
        <p className="font-mono text-[10px] text-muted-foreground">
          recortes del corpus de demostración
        </p>
      </div>
    </div>
  );
}

function DeckCardBody({ card, front }: { card: DeckCard; front: boolean }) {
  return (
    <div className="flex flex-col gap-2.5 p-5">
      <IdeologyStrip probabilities={card.distribution} className="h-1" />
      <p className="flex items-baseline justify-between gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
        <span className="truncate">
          {card.source} · {card.when}
        </span>
        {card.readingMinutes !== undefined && (
          <span className="shrink-0 tabular-nums">
            {card.readingMinutes} min
          </span>
        )}
      </p>
      <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug tracking-tight text-balance">
        {card.headline}
      </h3>
      {card.subtitle && (
        <p className="line-clamp-1 text-xs leading-5 text-muted-foreground">
          {card.subtitle}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <IdeologyBadge
          ideologyClass={card.predicted}
          confidence={card.distribution[card.predicted]}
          className="bg-card"
        />
        {card.slug && (
          <Link
            href={`/noticia/${card.slug}`}
            tabIndex={front ? 0 : -1}
            aria-label={`Leer la noticia: ${card.headline}`}
            onClick={(event) => event.stopPropagation()}
            className="group/link -m-2 flex items-center gap-1 p-2 font-mono text-[11px] text-muted-foreground outline-none transition-colors duration-150 ease-out-expo hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            Leer la noticia
            <ArrowRight
              aria-hidden
              className="size-3 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out-expo motion-safe:group-hover/link:translate-x-0.5"
            />
          </Link>
        )}
      </div>
    </div>
  );
}

function DeckCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 p-5">
      <TapeSkeleton />
      <Skeleton className="mt-1 h-3.5 w-40" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-3.5 w-24" />
      </div>
    </div>
  );
}
