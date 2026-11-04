# IdeoGraphCO-FE

Prototipo web interactivo del trabajo de grado **“Desarrollo de clasificador
multiclase para identificación de orientación ideológica en noticias políticas
colombianas”** (Universidad del Valle). Renderiza noticias paginadas y, para
cada una, la **clase ideológica predicha** y la **distribución de probabilidad
sobre las 8 clases** (salida softmax del clasificador).

> **Estado actual:** el listado, la búsqueda y el detalle consumen
> IdeoGraphCO-BE (contrato v2: `GET /api/v1/stories`, ver `CONTRACT.md` en
> ese repo): noticias reales de medios colombianos, de las que se muestra
> título, snippet, enlace al original y clasificación. La mesa de redacción
> clasifica con el mismo backend (`POST /api/v1/classify`).

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

Necesita IdeoGraphCO-BE corriendo (ver su README:
`uvicorn src.api.app:app --port 8000`). Variables, p. ej. en `.env.local`:

| Variable | Sin definir | Uso |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Listado, búsqueda y detalle |
| `NEXT_PUBLIC_CLASSIFIER_API_URL` | léxico de demostración | Mesa de redacción |

Ambas son la raíz versionada del backend (terminan en `/api/v1`). El BE solo
acepta los orígenes de su `CORS_ORIGINS` (por defecto
`http://localhost:3000`): si el FE corre en otro puerto, agrégalo allí.

## Estructura

```
src/
├── app/                       # Rutas (App Router). Archivos de ruta delgados.
│   ├── page.tsx               # Portada: noticias paginadas (?pagina=N)
│   ├── noticia/[slug]/        # Detalle + panel de análisis ideológico
│   ├── fuentes/[categoria]/   # Filtro por categoría de fuente (7 categorías)
│   └── buscar/                # Búsqueda (?q=…&pagina=N)
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
│   ├── services/articles.api.ts    # RTK Query (getArticles, getArticleBySlug → /stories del BE)
│   ├── services/classifier.api.ts  # RTK Query (classifyText → POST /classify del BE)
│   └── slices/preferences.slice.ts # Tema claro/oscuro
├── adapters/                  # DTO (snake_case) → modelo de UI (camelCase)
├── types/                     # ideology.ts (8 clases), article.ts (DTOs del contrato v2 + modelos)
└── lib/                       # site.ts (metadatos), format.ts (fechas/porcentajes)
```

## Flujo de datos

```
Componente de página ("use client")
        ↓ hook RTK Query (useGetArticlesQuery / useGetArticleBySlugQuery)
IdeoGraphCO-BE: GET /api/v1/stories · GET /api/v1/stories/{slug}
        ↓ PaginatedStoriesDTO / StoryDetailDTO (snake_case, src/schemas/dto.py)
adapters/article.adapter.ts (transformResponse)
        ↓ Paginated<Article> / ArticleDetail (camelCase)
UI (cards, distribución ideológica, cobertura por fuente, paginación)
```

La búsqueda (`/buscar`) usa el `q` del backend (título, subtítulo y medio,
sin tildes ni mayúsculas). En `/noticias`, los filtros de ideología, fuente y
fecha se aplican en la UI sobre las 50 noticias más recientes (el tope de
`page_size`), porque el backend no filtra por ideología ni por fecha.

### Detalle de una noticia

Sigue las reglas de renderizado del `CONTRACT.md` del BE. La lectura es
`synthesized.body`, siempre con su `disclaimer` visible, si la story tiene
síntesis; si no, el snippet del primer medio en reportar y el botón «Leer en
{medio}» hacia el original (el público nunca ve el cuerpo completo). Con más
de una fuente, la sección *Cobertura* lista cada medio con su propia
clasificación, o «Clasificación pendiente». El panel lateral muestra la
clasificación del artículo representativo.

### Mesa de redacción con el modelo real

La mesa de redacción (`ClassifierDesk`) clasifica con el modelo del trabajo
de grado si se define `NEXT_PUBLIC_CLASSIFIER_API_URL` (p. ej.
`http://localhost:8000/api/v1`): llama a `POST /classify` de IdeoGraphCO-BE,
que reenvía el texto al servicio de inferencia y no guarda nada. Si el BE
tiene `GEMINI_API_KEY`, antes pasa el texto por el filtro de politicidad de
la ingesta, y si este dice que no es una noticia política colombiana (422
`not_political`) la mesa lo explica en vez de clasificar. Sin clave, el BE
confía en el usuario y clasifica todo texto.
Sin la variable usa el léxico de demostración del navegador, y cada veredicto
declara cuál de los dos lo emitió. Va aparte de `NEXT_PUBLIC_API_URL` porque
depende del servicio de inferencia; normalmente las dos apuntan al mismo
backend.

## Las 8 clases ideológicas

Cuatro pares opuestos, alineados con `src.core.schema` del pipeline de ML:

| Clase | Opuesto |
|-------|---------|
| Populismo | Institucionalismo |
| Personalismo | Doctrinarismo |
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
- **Imágenes remotas**: `next/image` acepta cualquier host
  (`next.config.ts`), porque las fotos vienen de los medios del corpus y de
  sus CDN.
