import { NextRequest, NextResponse } from "next/server";
import { searchDuckDuckGo } from "@/lib/duckduckgo-search";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "latest tech news 2026";
  const debug = req.nextUrl.searchParams.get("debug") === "1";

  try {
    if (debug) {
      // Return raw HTML from DDG for debugging
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `q=${encodeURIComponent(query)}&b=`,
      });

      const html = await response.text();
      const hasResults = html.includes("result__a");
      const hasBlock = html.includes("blocked") || html.includes("captcha") || html.includes("anomaly");
      
      return NextResponse.json({
        query,
        status: response.status,
        htmlLength: html.length,
        hasResults,
        hasBlock,
        htmlSnippet: html.substring(0, 1000),
        timestamp: new Date().toISOString(),
      });
    }

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
