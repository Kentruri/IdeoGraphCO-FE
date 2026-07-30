# IdeoGraphCO-FE

Prototipo web interactivo del trabajo de grado **“Desarrollo de clasificador
multiclase para identificación de orientación ideológica en noticias políticas
colombianas”** (Universidad del Valle). Renderiza noticias paginadas y, para
cada una, la **clase ideológica predicha** y la **distribución de probabilidad
sobre las 8 clases** (salida softmax del clasificador).

> **Estado actual:** la API real (IdeoGraphCO-BE) aún no existe, así que el
> frontend consume rutas mock (`src/app/api`) con datos de demostración.
> Medios, autores y clasificaciones son ficticios.

## Stack

- **Next.js 15** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4 + shadcn/ui** — un solo sistema de estilos
- **Redux Toolkit + RTK Query** — estado global y capa de datos (sin Context propio)
- **next/font** — Inter (UI), Lora (titulares), Geist Mono (código)

## Cómo correr

```bash
yarn install
yarn dev        # http://localhost:3000
yarn build      # build de producción
yarn lint
```

## Estructura

```
src/
├── app/                       # Rutas (App Router). Archivos de ruta delgados.
│   ├── page.tsx               # Portada: noticias paginadas (?pagina=N)
│   ├── noticia/[slug]/        # Detalle + panel de análisis ideológico
│   ├── fuentes/[categoria]/   # Filtro por categoría de fuente (7 categorías)
│   ├── buscar/                # Búsqueda (?q=…&pagina=N)
│   └── api/articles/          # ⚠ MOCK de IdeoGraphCO-BE (listado + detalle)
├── components/
│   ├── pages/                 # Composición de cada página (patrón del repo de referencia)
│   ├── articles/              # Cards, grid, paginación
│   ├── ideology/              # Badge, franja apilada y distribución de 8 clases
│   ├── layout/                # Navbar, Footer, ThemeToggle
│   ├── search/                # SearchBar
│   ├── skeletons/             # Estados de carga
│   ├── feedback/              # Estados de error / vacío
│   └── ui/                    # shadcn/ui (generado)
├── store/                     # Redux Toolkit
│   ├── services/articles.api.ts    # RTK Query (getArticles, getArticleBySlug)
│   └── slices/preferences.slice.ts # Tema claro/oscuro
├── adapters/                  # DTO (snake_case) → modelo de UI (camelCase)
├── types/                     # ideology.ts (8 clases), article.ts (DTOs + modelos)
├── mocks/                     # Dataset de demostración + "base de datos" en memoria
└── lib/                       # site.ts (metadatos), format.ts (fechas/porcentajes)
```

## Flujo de datos

```
Componente de página ("use client")
        ↓ hook RTK Query (useGetArticlesQuery / useGetArticleBySlugQuery)
/api/articles (mock, misma forma que tendrá IdeoGraphCO-BE)
        ↓ PaginatedDTO<ArticleDTO> (snake_case)
adapters/article.adapter.ts (transformResponse)
        ↓ Paginated<Article> (camelCase)
UI (cards, distribución ideológica, paginación)
```

### Conectar la API real

1. Define `NEXT_PUBLIC_API_URL` (p. ej. `https://api.ideographco.dev/v1`).
2. Asegura que el backend devuelva los DTOs de `src/types/article.ts`
   (o ajusta solo `src/adapters/article.adapter.ts`).
3. Borra `src/app/api/articles` y `src/mocks/`.

## Las 8 clases ideológicas

Cuatro pares opuestos, alineados con `src.core.schema` del pipeline de ML:

| Clase | Opuesto |
|-------|---------|
| Personalismo | Institucionalismo |
| Populismo | Doctrinarismo |
| Soberanismo | Globalismo |
| Conservadurismo | Progresismo |

Cada clase tiene un color propio definido en `globals.css`
(`--ideology-*`, con variantes claro/oscuro). La paleta fue validada para
daltonismo y contraste (separación CVD y ratio ≥ 3:1 sobre las superficies
reales del tema); el orden de los segmentos en las franjas apiladas
(`IDEOLOGY_DISPLAY_ORDER`) hace parte de esa validación — **no reordenar sin
re-validar**. La identidad de una clase nunca depende solo del color: siempre
va acompañada de su etiqueta de texto.

## Decisiones de arquitectura

- **Rutas delgadas + `components/pages/`**: replica el patrón de
  the-unbiased-journal-frontend (rutas server que componen páginas cliente).
- **Adapter de DTOs**: si cambia el contrato del backend, solo se toca
  `src/adapters/`.
- **Redux en lugar de Context**: el tema y la capa de datos viven en el store;
  RTK Query maneja caché, revalidación y estados de carga.
- **Mock API como route handlers**: el frontend ya consume HTTP real
  (paginación, filtros y 404 incluidos), de modo que el cambio a la API real
  es solo de URL.
