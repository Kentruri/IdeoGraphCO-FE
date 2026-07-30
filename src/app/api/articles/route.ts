import { NextRequest, NextResponse } from "next/server";

import { queryArticles } from "@/mocks/db";
import { SOURCE_CATEGORIES, type SourceCategory } from "@/types/article";

const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 50;

/**
 * GET /api/articles?page=&page_size=&source_category=&q=
 *
 * Mock del endpoint de listado de IdeoGraphCO-BE. Devuelve noticias
 * paginadas con su clasificación ideológica.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(params.get("page_size")) || DEFAULT_PAGE_SIZE)
  );

  const rawCategory = params.get("source_category") ?? undefined;
  if (
    rawCategory !== undefined &&
    !SOURCE_CATEGORIES.includes(rawCategory as SourceCategory)
  ) {
    return NextResponse.json(
      { error: `source_category inválida: ${rawCategory}` },
      { status: 400 }
    );
  }

  const data = await queryArticles({
    page,
    pageSize,
    sourceCategory: rawCategory as SourceCategory | undefined,
    q: params.get("q") ?? undefined,
  });

  return NextResponse.json(data);
}
