import { NextResponse } from "next/server";

import { findArticleBySlug } from "@/mocks/db";

/**
 * GET /api/articles/:slug
 *
 * Mock del endpoint de detalle de IdeoGraphCO-BE. Devuelve la noticia
 * completa (cuerpo por párrafos) junto con la clase ideológica predicha
 * y la distribución de probabilidad sobre las 8 clases.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);

  if (!article) {
    return NextResponse.json(
      { error: `No existe una noticia con slug: ${slug}` },
      { status: 404 }
    );
  }

  return NextResponse.json(article);
}
