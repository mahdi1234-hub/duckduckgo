import { NextRequest, NextResponse } from "next/server";
import { searchDuckDuckGo } from "@/lib/duckduckgo-search";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "latest tech news 2026";

  try {
    const results = await searchDuckDuckGo(query, 5);

    return NextResponse.json({
      query,
      resultsCount: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage, query }, { status: 500 });
  }
}
