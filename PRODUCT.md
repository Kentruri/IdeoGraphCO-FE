# PRODUCT.md — IdeoGraphCO

> Capturado de forma autónoma (usuario simulado estructurado) a partir del README,
> `src/lib/site.ts`, `src/types/ideology.ts` y el footer del producto, por
> instrucción explícita de ejecutar el rediseño sin pausas de aprobación.

## Qué es

Prototipo web interactivo del trabajo de grado **"Desarrollo de clasificador
multiclase para identificación de orientación ideológica en noticias políticas
colombianas"** (Universidad del Valle, Escuela de Ingeniería de Sistemas y
Computación). Muestra noticias políticas y, para cada una, la **clase ideológica
predicha** y la **distribución de probabilidad softmax sobre 8 clases**.

## A quién sirve

- **Jurados y comunidad académica**: evalúan el clasificador a través de una
  interfaz que hace legible su salida.
- **Lectores curiosos de prensa política**: exploran el encuadre ideológico de
  las noticias sin conocimientos de ML.

## Verdad del dominio (no negociable)

- **8 clases ideológicas** en **4 pares opuestos** (ejes teóricos del anteproyecto):
  personalismo↔institucionalismo, populismo↔doctrinarismo,
  soberanismo↔globalismo, conservadurismo↔progresismo.
- La **paleta categórica de 8 colores** está validada (CVD + contraste) en ambos
  temas y su orden de despliegue (`IDEOLOGY_DISPLAY_ORDER`) no se reordena.
- Regla de accesibilidad heredada: **el color nunca identifica solo**; siempre
  acompaña una etiqueta de texto.
- La distribución **suma 1** y describe el encuadre dominante del texto, **no la
  veracidad** de los hechos. La interfaz nunca debe insinuar juicio de verdad.
- **Neutralidad**: el producto no puede favorecer visualmente ninguna clase;
  por eso el cromo no adopta ningún color de acento de marca.
- Los datos actuales son de **demostración** (la API real no existe aún); el
  footer lo declara.

## Superficies

- `/` — portada: presentación del instrumento + noticias paginadas (`?pagina=N`).
- `/noticia/[slug]` — lectura + panel de análisis ideológico.
- `/fuentes/[categoria]` — filtro por 7 categorías de fuente.
- `/buscar` — búsqueda (`?q=…&pagina=N`).
- 404.

## Restricciones técnicas

- Next.js 15 App Router + React 19 + Tailwind 4 + shadcn/Radix.
- Estado y datos: Redux Toolkit + RTK Query (no tocar), adapters y tipos
  intocables. Idioma: español (es-CO). Tema claro/oscuro con toggle persistido.
- Plataforma: web responsive (móvil → escritorio).
