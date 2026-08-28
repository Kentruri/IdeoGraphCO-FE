# Sistema de diseño — IdeoGraphCO · Dirección "Prensa instrumental"

**Fecha:** 2026-08-27 · Rediseño completo (sustituye a la dirección "sala de
redacción de datos" del refactor anterior). Verdad de producto en `PRODUCT.md`.

## 0. Lectura de diseño

*Leyendo esto como: portada-manifiesto + producto editorial de datos para
jurados académicos y lectores de prensa, con un lenguaje editorial-instrumental
latinoamericano, sobre Tailwind 4 + shadcn con tokens y componentes propios.*

**Diales** — landing: VARIANCE 7 · MOTION 6 · DENSITY 4. Pantallas de producto:
VARIANCE 5 · MOTION 4 · DENSITY 5.

## 1. La dirección: "Prensa instrumental"

IdeoGraphCO es dos cosas a la vez: **prensa** (noticias políticas colombianas)
e **instrumento** (un clasificador que mide encuadres). La dirección funde las
dos tradiciones visuales:

- De la **prensa impresa latinoamericana**: titulares en grotesca expandida,
  reglas dobles de imprenta entre secciones, serif de texto para lectura larga,
  ritmo de columnas asimétrico con riel de metadatos.
- Del **instrumento de medición**: toda cifra en monoespaciada tabular, cintas
  de medición (franjas softmax) como firma recurrente, el grafo de nodos de 8
  clases como materia visual del hero, fichas técnicas en el detalle.

**Anti-referencias** (lo que este mundo nunca hace): tema shadcn de fábrica,
hero centrado con gradiente, tres cards con iconito, sombras suaves como
sistema de profundidad, gris #fafafa + Inter.

### Decisión de color central (heredada y reafirmada)

El producto **no tiene color de acento de marca**: cualquier tono elegido
coincidiría con una de las 8 clases y sesgaría la lectura de neutralidad. El
cromo es tinta y papel; **la única tinta expresiva es la paleta categórica de
8 clases**, que aparece como materia (grafo del hero), como medición (cintas y
barras) y como identidad (badges con punto + etiqueta).

## 2. Tipografía

| Rol | Fuente | Token | Notas |
|---|---|---|---|
| Display / titulares | **Archivo** (variable, eje `wdth`) | `--font-display` (alias `--font-heading`) | Grotesca de Omnibus-Type (AR) diseñada para titulares de prensa. Voz expandida (`font-stretch-expanded`) en aperturas y marca; 600-800 de peso; tracking apretado. |
| Lectura larga | **Source Serif 4** (+itálica) | `--font-serif` | Solo cuerpo y titular del artículo en `/noticia`. |
| UI y cuerpo corto | **Schibsted Grotesk** | `--font-sans` | Diseñada para medios (grupo Schibsted). Nunca Inter. |
| Datos | **Spline Sans Mono** | `--font-mono` | Toda cifra, fecha técnica, etiqueta de medición. Siempre `tabular-nums`. |

Escala display: apertura de página `text-5xl → text-7xl` (clamp por breakpoint),
sección `text-3xl → text-5xl`, titular de tile `text-lg/xl`. Emphasis con peso y
ancho (`font-stretch`), no con cursivas ajenas ni gradientes.

## 3. Color

Neutros OKLCH con matiz cálido de papel/grafito (hue 75-85, chroma ≤ 0.014):

- **Claro "papel prensa"**: fondo L=0.976, tinta L=0.19, bordes L=0.885.
- **Oscuro "cuarto de mapas"**: fondo L=0.146 (luminancia de la superficie donde
  se validó la paleta), tarjetas L=0.196, nunca negro puro.
- `--primary` = tinta (invertida en oscuro). `--destructive` reservado a error.
- Paleta ideológica: intocable, definida en `:root`/`.dark` (globals.css).

Superficies de navegador tematizadas (firma barata que los templates omiten):
`::selection` invertido (tinta sobre papel ↔ papel sobre tinta), `caret-color`
de tinta, scrollbar fino con thumb de borde.

## 4. Forma, composición y espaciado

- **Radio:** `--radius: 0.25rem` — casi filo de imprenta. Pill solo para
  identificadores de clase (badge/punto). Nada intermedio.
- **Profundidad:** sin sombras difusas como sistema; jerarquía por hairlines,
  reglas dobles (`.rule-double`, 4px double) y contraste de superficie.
- **Composición:** grid de 12 con **riel de metadatos** (columna mono estrecha a
  la izquierda en secciones de landing), aperturas asimétricas (contenido
  desplazado, vacíos deliberados), tipografía gigante donde el mensaje lo es
  (hero, ejes de tensión, 404, categorías). En móvil todo colapsa a 1 columna.
- **Espaciado:** escala Tailwind; secciones de landing `py-24/32`, producto
  `py-10`. Tokens estructurales: `--spacing-header` (6rem), `--spacing-aside`
  (24rem, panel del detalle).

## 5. Firmas del mundo (dónde vive la memoria)

1. **Grafo ideológico** (`IdeoGraphCanvas`): canvas 2D generativo del hero; 8
   constelaciones de nodos (una por clase) unidas por aristas, con deriva
   orgánica y repulsión al puntero. Reduced-motion → frame estático.
2. **Regla doble de imprenta** en cada apertura de sección.
3. **Cinta de medición** (franja softmax) en el borde superior de cada tile de
   noticia y bajo el titular destacado.
4. **Ejes de tensión**: los 4 pares opuestos como filas tipográficas gigantes
   enfrentadas sobre un eje hairline (sección propia de la landing y ficha del
   detalle).
5. **Cifras que respiran**: contadores y porcentajes en mono con entrada
   animada (motivada: son la medición, no decoración).

## 6. Movimiento

Curvas: `--ease-out-expo (0.16,1,0.3,1)` para entradas/hover;
`--ease-in-out-strong (0.77,0,0.175,1)` para morphs; `--ease-drawer
(0.32,0.72,0,1)` para el sheet. UI < 300ms; momentos hero (canvas, reveals de
apertura) hasta 700ms. Todo movimiento no esencial bajo `motion-safe`/
`useReducedMotion`; el grafo y el smooth scroll (Lenis) se desactivan por
completo con reduced motion. Solo `transform/opacity/clip-path/color`.

## 7. Reglas de componentes

- Todo valor visual sale de token; prohibidos hex sueltos y curvas inline.
- Variantes CVA en primitivos y componentes de dominio.
- Estados de carga con carácter: skeletons de línea editorial + cinta de 8
  segmentos en shimmer, nunca rectángulos genéricos sin estructura.
- Vacío/error diseñados con el motivo de los 8 puntos (desaturados u
  offset destructivo) + acción clara.
- Jerarquía: tiles de listado en `h2`; descripciones de clases accesibles por
  teclado (tooltip Radix o texto visible), jamás `title=`.
- Cifras: `font-mono tabular-nums` sin excepción.

## 8. Qué se conserva

Rutas, IA, copy funcional, Redux/RTK Query/adapters/tipos, script anti-FOUC,
paleta ideológica y su orden CVD, primitivos shadcn como base de Radix (re-tematizados
por token). Dependencias nuevas permitidas: `motion` (micro-interacciones y
reveals) y `lenis` (scroll suave con opt-out por reduced-motion).
