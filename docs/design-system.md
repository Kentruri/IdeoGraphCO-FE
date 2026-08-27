# Sistema de diseño — IdeoGraphCO

**Fecha:** 2026-08-26 · **Rama:** `ui-refactor` · Derivado de `docs/ui-audit.md` (fase 1).

## 1. Dirección: "Sala de redacción de datos"

IdeoGraphCO mide el encuadre ideológico de noticias. La interfaz debe transmitir dos cosas a la vez: **seriedad editorial** (es un producto sobre prensa política) y **precisión de medición** (detrás hay un clasificador con distribuciones softmax). La dirección elegida combina ambas:

- **Editorial**: tipografía de titulares serif con carácter de prensa, ritmo de reglas finas (hairlines) y jerarquía de portada de periódico.
- **De datos**: cifras siempre en mono con `tabular-nums`, la paleta categórica de 8 clases como única fuente de color expresivo, cromo neutro "tinta sobre papel" que nunca compite con los datos.

**Decisión clave de color:** el producto **no tiene color de acento de marca**. Cualquier tono elegido (azul, verde, morado…) coincidiría con una de las 8 clases ideológicas y sesgaría la lectura de neutralidad. La "marca" es la franja completa de 8 colores; el cromo es tinta neutra con un matiz frío casi imperceptible (hue 260, chroma ≤ 0.015). Esto es una decisión, no una omisión.

**Modo (impeccable):** Operate/Read híbrido. Los listados son Operate (escanear, filtrar, paginar); el detalle de noticia es Read (comprensión). Nada de recursos de landing (marquees, héroes persuasivos).

**Diales (design-taste):** VARIANCE 4 · MOTION 3 (fase 4 añade micro-interacciones puntuales) · DENSITY 4.

## 2. Tipografía

| Rol | Fuente | Token | Uso |
|---|---|---|---|
| Titulares y display | **Newsreader** (variable, con itálica) | `--font-heading` / `font-heading` | h1-h3 editoriales, titulares de tarjeta, marca |
| Lectura larga | **Newsreader** | `--font-serif` / `font-serif` | Cuerpo del artículo en detalle |
| UI y cuerpo corto | **Geist** | `--font-sans` / `font-sans` (base) | Navegación, botones, metadatos, párrafos de UI |
| Datos y cifras | **Geist Mono** | `--font-mono` / `font-mono` | Probabilidades, confianza, contadores, versión del modelo — siempre con `tabular-nums` |

**Por qué:** Newsreader fue diseñada específicamente para lectura de noticias en pantalla (ejes ópticos para display y texto): encaja con el dominio sin caer en los serif-cliché (Fraunces/Instrument, vetados por design-taste). Geist sustituye a Inter (default genérico) manteniendo neutralidad de UI con mejor dibujo de cifras; su mono hermana da coherencia a los datos. Se retira Lora e Inter.

**Escala de titulares** (la escala de cuerpo es la de Tailwind):

- Display de portada: `text-4xl md:text-5xl` + `font-heading` + `tracking-tight` + `text-balance`
- h1 de sección/detalle: `text-3xl md:text-4xl`
- Titular destacado: `text-2xl md:text-3xl`
- Titular de tarjeta: `text-lg` `leading-snug`
- La itálica de Newsreader se reserva para énfasis editorial puntual (misma familia, nunca otra fuente).

## 3. Color

Tokens semánticos shadcn recalibrados en OKLCH con matiz tinta (hue 260, chroma 0.002-0.015). Sin valores fuera de tokens.

- **Claro:** papel `--background` L=0.99; tinta `--foreground` L=0.21; `--muted-foreground` baja a L=0.50 (antes 0.556) para asegurar ≥4.5:1 sobre papel.
- **Oscuro:** superficie L=0.145 (se conserva la luminancia sobre la que se validó la paleta ideológica), tarjetas L=0.205, nada de negro puro.
- **Paleta ideológica:** intocable (validada CVD + contraste en ambos temas, `globals.css`). Regla heredada: *el color nunca identifica solo; siempre va acompañado de etiqueta de texto.*
- `--primary` = tinta (botón primario es "tinta sobre papel", invertido en oscuro). `--destructive` se mantiene.

## 4. Forma, espaciado y layout

- **Radio:** `--radius: 0.5rem` (antes 0.625). Sistema documentado: controles `rounded-md`, contenedores/tarjetas `rounded-xl`, identificadores de clase (badges/dots) `rounded-full` (pill). Ninguna otra forma.
- **Espaciado:** escala de Tailwind; ritmo de página `py-10`, separación de secciones `space-y-10`, interior de tarjeta `--card-spacing` (ya tokenizado por shadcn).
- **Tokens de layout nuevos** (`@theme`):
  - `--spacing-header: 7rem` → altura total del header pegajoso de escritorio (56 + 40 + borde); habilita `top-header`, `scroll-mt-header`. Elimina el mágico `top-32`.
  - `--spacing-aside: 22.5rem` → columna del panel de análisis (antes `360px` suelto).
- **Reglas finas:** los `Separator` marcan el ritmo editorial de las páginas; dentro de las tarjetas se agrupa con espacio, no con bordes.

## 5. Movimiento (base; el pass completo es fase 4)

Tokens de easing en `@theme` (curvas fuertes, no las débiles de CSS):

- `--ease-swift: cubic-bezier(0.23, 1, 0.32, 1)` → entradas/salidas y hovers (`ease-swift`)
- `--ease-smooth: cubic-bezier(0.77, 0, 0.175, 1)` → morphs/movimiento en pantalla (`ease-smooth`)

Duraciones: feedback de pulsación 100-160ms · hover/tooltips 125-200ms · overlays 200-250ms. **Tope: 300ms.** Solo se animan `transform`, `opacity`, `color` y `clip-path`. Todo movimiento no esencial se apaga bajo `prefers-reduced-motion` (regla global en `globals.css` + variantes `motion-safe:`).

## 6. Reglas de componentes

- **Todo valor visual sale de un token.** Prohibido reintroducir `top-32`, `360px`, hex sueltos o curvas inline.
- **Variantes con CVA** en primitivos (button/badge ya lo hacen); los componentes de dominio con variantes (`IdeologyBadge` tamaños, estados de feedback) también se expresan en CVA.
- **Un solo efecto de hover principal por superficie** (tarjetas: elevación sutil + titular a color de tinta; sin subrayado + zoom + sombra simultáneos).
- **Descripciones accesibles:** las explicaciones de clases ideológicas van en `Tooltip` (Radix) con trigger enfocable o texto visible; `title=` queda prohibido como único canal.
- **Jerarquía:** los titulares de tarjeta en listados son `h2`; `h3` solo bajo un `h2` real.
- **Estados:** toda vista cubre carga (skeleton fiel al layout), vacío (icono contextual + acción) y error (icono + retry). Composición compartida en `States.tsx` vía CVA.
- **Cifras:** `font-mono tabular-nums` sin excepción (probabilidades, confianza, contadores, paginación).

## 7. Qué se conserva del incumbente

- Paleta ideológica y su orden de despliegue CVD (`IDEOLOGY_DISPLAY_ORDER`).
- Arquitectura de información, rutas, copy y lógica (Redux/RTK Query, adapters, tipos): fuera del alcance del refactor.
- Script anti-FOUC de tema y el toggle respaldado por Redux.
- Primitivos shadcn (ya consumen tokens); solo se recalibran los valores de los tokens.
