import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Try multiple regions by using different DDG endpoints
export const preferredRegion = ["iad1", "sfo1", "lhr1", "hnd1", "cdg1"];

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2F;/g, "/");
}

async function searchDDGLite(query: string): Promise<SearchResult[]> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) return [];

  const html = await response.text();
  const results: SearchResult[] = [];

  const linkRegex =
    /<a[^>]+class="result-link"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex =
    /<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

  const links: { url: string; title: string }[] = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    links.push({
      url: match[1],
      title: decodeHTMLEntities(match[2].replace(/<[^>]*>/g, "").trim()),
    });
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(
      decodeHTMLEntities(match[1].replace(/<[^>]*>/g, "").trim())
    );
  }

  for (let i = 0; i < Math.min(links.length, 10); i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] || "",
    });
  }

  return results;
}

async function searchDDGHTML(query: string): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://duckduckgo.com/",
    },
  });

  if (!response.ok || response.status === 202) return [];

  const html = await response.text();
  if (!html.includes("result__a")) return [];

  const results: SearchResult[] = [];
  const resultRegex =
    /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex =
    /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  const links: { url: string; title: string }[] = [];
  let match;

  while ((match = resultRegex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith("//duckduckgo.com/l/?uddg=")) {
      try {
        const urlParam = new URL(`https:${href}`).searchParams.get("uddg");
        if (urlParam) href = decodeURIComponent(urlParam);
      } catch {
        // keep original
      }
    }
    links.push({
      url: href,
      title: decodeHTMLEntities(match[2].replace(/<[^>]*>/g, "").trim()),
    });
  }

  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    snippets.push(
      decodeHTMLEntities(match[1].replace(/<[^>]*>/g, "").trim())
    );
  }

  for (let i = 0; i < Math.min(links.length, 10); i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] || "",
    });
  }

  return results;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    // Try DDG HTML first, then Lite
    let results = await searchDDGHTML(query);
    const source = results.length > 0 ? "html" : "lite";
    
    if (results.length === 0) {
      results = await searchDDGLite(query);
    }

    return NextResponse.json({
      results,
      query,
      source,
      resultsCount: results.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: msg, results: [] }, { status: 500 });
  }
}
