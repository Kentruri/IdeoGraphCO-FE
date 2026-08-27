# Auditoría de UI — IdeoGraphCO-FE

**Fecha:** 2026-08-26 · **Rama:** `ui-refactor` · **Método:** impeccable `audit` + `critique`, revisión pantalla por pantalla con la app corriendo (`/`, `/buscar`, `/fuentes/[categoria]`, `/noticia/[slug]`, `not-found`), detector mecánico (`detect.mjs` → 0 hallazgos deterministas).

## Veredicto de integridad de implementación

**Aprueba con reservas.** El código es limpio, consistente y accesible en lo básico, pero la implementación visual es **shadcn por defecto sin identidad de producto**: tema neutro sin tocar, Inter como sans, radios y sombras de fábrica. El único activo visual propio del producto —la paleta categórica de 8 clases ideológicas, validada para CVD— se presenta como detalle marginal (puntos de 8px, franjas de 6px) en lugar de ser la columna vertebral de la marca. La interfaz es intercambiable con cualquier starter de shadcn: eso es el patrón genérico ("AI slop") a corregir, no un problema de calidad de código.

## Puntuación de salud

| # | Dimensión | Puntaje | Hallazgo clave |
|---|-----------|---------|----------------|
| 1 | Accesibilidad | 2/4 | Tooltips solo por `title` (invisibles a teclado/táctil); salto de jerarquía h1→h3 |
| 2 | Rendimiento | 3/4 | `IdeologyDistribution` anima `width` (propiedad de layout) |
| 3 | Diseño responsive | 3/4 | Objetivos táctiles de paginación de 36px; resto sólido |
| 4 | Theming | 2/4 | Valores mágicos sueltos (`top-32`, `360px`, `8.5rem`, `min-h-[320px]`); doble sistema de fuente de título sin token |
| 5 | Integridad de implementación | 2/4 | Sistema visual 100% genérico; activo distintivo (paleta ideológica) infrautilizado |
| **Total** | | **12/20** | **Aceptable — requiere trabajo significativo** |

## Resumen ejecutivo

- 0 hallazgos P0 · 6 P1 · 9 P2 · 3 P3.
- Los tres problemas de fondo: (1) ausencia total de identidad visual propia, (2) descripciones de clases ideológicas inaccesibles sin mouse, (3) tokens incompletos que dejan valores mágicos en componentes.
- La base funcional es buena: todas las pantallas cubren carga/vacío/error, el tema oscuro funciona sin parpadeo, los formatos usan `Intl` con `es-CO`.

## Hallazgos detallados

### P1 — Mayores

**[P1-1] Identidad visual genérica (tema shadcn de fábrica)**
- Ubicación: `src/app/globals.css`, `src/app/layout.tsx`, todos los componentes.
- Categoría: Integridad / Theming.
- Impacto: el producto no es distinguible de un template; la marca del producto (medición ideológica) no se expresa en la superficie.
- Recomendación: definir dirección de diseño editorial propia (fase 2): tipografía de titulares con carácter, escala tipográfica y de espaciado documentada, cromo neutro calibrado para que la paleta de 8 clases sea la protagonista.
- Comando sugerido: `/impeccable init` + fase 2.

**[P1-2] Tooltips dependientes de `title`**
- Ubicación: `IdeologyBadge.tsx:28`, `IdeologyStrip.tsx:31`, `IdeologyDistribution.tsx:42`, `HomePage.tsx:48`.
- Categoría: Accesibilidad (WCAG 1.4.13 / 4.1.2).
- Impacto: usuarios de teclado y táctiles nunca ven las descripciones de las clases ideológicas — el contenido explicativo central del producto. `ui/tooltip.tsx` existe y está sin usar.
- Recomendación: sustituir `title` por Tooltip de Radix con trigger enfocable; en la leyenda de portada, mostrar la descripción en texto visible o popover accesible.

**[P1-3] Salto de jerarquía de encabezados**
- Ubicación: `ArticleCard.tsx:49` (h3) usado bajo h1 sin h2 en `/buscar` y `/fuentes/*`.
- Categoría: Accesibilidad (WCAG 1.3.1).
- Impacto: navegación por encabezados con lector de pantalla queda inconsistente.
- Recomendación: los titulares de tarjeta deben ser h2 en listados (o introducir h2 de sección "Últimas noticias").

**[P1-4] Animación de propiedad de layout**
- Ubicación: `IdeologyDistribution.tsx:62` (`transition-[width]`).
- Categoría: Rendimiento.
- Impacto: 8 barras re-layout en cada render; en el panel lateral pegajoso puede costar frames.
- Recomendación: animar `transform: scaleX()` con `transform-origin: left`.

**[P1-5] Foco invisible en tarjetas-enlace**
- Ubicación: `ArticleCard.tsx:22`, `FeaturedArticleCard.tsx:23`.
- Categoría: Accesibilidad (WCAG 2.4.7).
- Impacto: el `Link` que envuelve toda la tarjeta no tiene estilo `focus-visible`; el outline nativo queda recortado por `overflow-hidden rounded-xl`.
- Recomendación: `focus-visible:ring` en la Card (via `focus-within` o clase en el Link) coherente con el sistema.

**[P1-6] Sistema de feedback incoherente**
- Ubicación: `States.tsx`.
- Categoría: Integridad / UX.
- Impacto: `EmptyState` usa siempre el icono `SearchX` aunque el contexto no sea búsqueda (portada, categorías); `ErrorState` no tiene icono; ambos comparten el mismo contenedor "borde punteado" genérico.
- Recomendación: estados con icono contextual (parámetro), acción primaria clara y composición propia del sistema.

### P2 — Menores

**[P2-1] Valores mágicos fuera de tokens** — `ArticleDetailPage.tsx:39` (`360px`, `lg:top-32` que además no corresponde a la altura real del header de 96px), `IdeologyDistribution.tsx:43` (`8.5rem`), `FeaturedArticleCard.tsx:28` (`min-h-[320px]`), `Navbar.tsx:35` (`w-80`), `Navbar.tsx:77` (`w-56`). → Consolidar en tokens/`@theme` (fase 2).

**[P2-2] Doble sistema tipográfico sin token** — `--font-heading` apunta a sans en `globals.css:13` pero todos los titulares usan `font-serif` ad hoc. La Card usa `font-heading` (sans) para `CardTitle` mientras las páginas la pisan con `font-serif`. → Un solo token `--font-heading` real.

**[P2-3] Portada sin momento visual** — `HomePage.tsx:32-61`: h1 + párrafo + leyenda de puntos diminutos. La leyenda de 8 clases es la firma del producto y parece una nota al pie. → Recomponer encabezado editorial con la paleta como protagonista.

**[P2-4] Objetivos táctiles de paginación** — `PaginationControls.tsx` usa `size="icon"` (36px) < 44px recomendado en móvil (WCAG 2.5.8 AAA). → `size-11` en viewports táctiles o padding mayor.

**[P2-5] Triple efecto hover en tarjetas** — `ArticleCard.tsx`: sombra + subrayado + zoom de imagen compiten. El subrayado sobre serif es pesado. → Un efecto principal (elevación o zoom) + cambio de color del titular.

**[P2-6] Pie de tarjeta sobrecargado** — 3 filas apiladas (badge+reloj / franja / fecha) con la fecha huérfana al final. → Reagrupar meta en una sola línea y dar aire a la franja.

**[P2-7] Placeholder "Sin imagen" débil** — texto plano centrado (`ArticleCard.tsx:37`). → Composición propia (patrón tipográfico o monograma del medio) coherente con el sistema.

**[P2-8] Búsqueda sin affordance de envío ni limpieza** — `SearchBar.tsx`: solo Enter envía; no hay botón visible ni clear. → Botón de envío accesible dentro del input.

**[P2-9] Sin gestión de `prefers-reduced-motion`** — zoom de imagen en hover y transición de barras no se desactivan. Hoy el movimiento es sutil (impacto bajo), pero la fase 4 añadirá motion: la base debe respetar la preferencia desde ya.

### P3 — Pulido

**[P3-1]** `ArticleDetailSkeleton` no refleja el `CardHeader` real del panel (desalineación menor al cargar).
**[P3-2]** Breadcrumb solo existe en detalle; las páginas de categoría no ofrecen ruta de regreso más allá del nav.
**[P3-3]** `outline-ring/50` global en `*` (globals.css:145) aplica color de outline a todo; inocuo pero impreciso.

## Patrones sistémicos

1. **Tema por defecto intacto**: ningún token propio fuera de la paleta ideológica. Todo lo demás es el scaffold de shadcn.
2. **`title` como mecanismo universal de descripción**: aparece en 4 componentes; patrón inaccesible repetido.
3. **Composición correcta pero anónima**: grid 3 columnas + card + badge en todas las vistas; ninguna decisión de layout expresa el dominio (análisis ideológico).

## Hallazgos positivos (mantener)

- **Estados completos**: todas las rutas cubren carga (skeletons fieles al layout), vacío y error con retry.
- **Paleta ideológica validada CVD** con re-escala para tema oscuro y regla "el color nunca va solo" documentada.
- **Accesibilidad de base**: `aria-current` en nav, `aria-label` en paginación/búsqueda/franjas, `role="search"`, `role="img"` con resumen textual en `IdeologyStrip`.
- **Tema oscuro sin FOUC** (script inline antes de la primera pintura) y sincronizado con Redux/localStorage.
- **Formato local es-CO** con `Intl` (fechas relativas, probabilidades con coma decimal).
- **`tabular-nums`** en cifras.
- Botones shadcn nuevos ya traen `active:translate-y-px` (feedback de pulsación).

## Acciones recomendadas (en orden)

1. **[P1] Fase 2 — sistema de diseño**: dirección editorial propia + tokens `@theme` (resuelve P1-1, P2-1, P2-2).
2. **[P1] `/impeccable harden` parcial en componentes ideológicos**: tooltips accesibles (P1-2), jerarquía de encabezados (P1-3), foco visible (P1-5).
3. **[P1] `/impeccable optimize`**: barra de distribución con `scaleX` (P1-4).
4. **[P1] `/impeccable clarify` + rediseño de `States.tsx`** (P1-6, P2-7).
5. **[P2] `/impeccable layout`**: portada (P2-3), tarjetas (P2-5, P2-6), paginación (P2-4), búsqueda (P2-8).
6. **[P2] Base de `prefers-reduced-motion`** antes del motion pass de fase 4 (P2-9).
7. **[P3] `/impeccable polish`**: skeletons, breadcrumbs, detalles finales.
