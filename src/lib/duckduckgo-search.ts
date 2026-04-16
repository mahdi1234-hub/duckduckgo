import * as cheerio from "cheerio";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Search DuckDuckGo using the HTML lite version which is more reliable
 * for scraping than the main site.
 */
async function searchDDGLite(query: string): Promise<SearchResult[]> {
  const url = "https://lite.duckduckgo.com/lite/";
  const body = new URLSearchParams({ q: query, kl: "" });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getRandomUserAgent(),
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`DDG Lite returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  // DDG Lite has results in a table format
  const rows = $("table")
    .last()
    .find("tr");
  
  let currentResult: Partial<SearchResult> = {};

  rows.each((_, row) => {
    const link = $(row).find("a.result-link");
    if (link.length > 0) {
      if (currentResult.title && currentResult.url) {
        results.push(currentResult as SearchResult);
      }
      currentResult = {
        title: link.text().trim(),
        url: link.attr("href") || "",
        snippet: "",
      };
    }

    const snippet = $(row).find("td.result-snippet");
    if (snippet.length > 0 && currentResult.title) {
      currentResult.snippet = snippet.text().trim();
    }
  });

  // Push the last result
  if (currentResult.title && currentResult.url) {
    results.push(currentResult as SearchResult);
  }

  return results;
}

/**
 * Search DuckDuckGo using the HTML version as a fallback
 */
async function searchDDGHTML(query: string): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": getRandomUserAgent(),
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`DDG HTML returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".result").each((_, el) => {
    const titleEl = $(el).find(".result__title a, .result__a");
    const snippetEl = $(el).find(".result__snippet");
    const title = titleEl.text().trim();
    let href = titleEl.attr("href") || "";

    // DDG HTML wraps URLs in a redirect
    if (href.startsWith("//duckduckgo.com/l/?uddg=")) {
      try {
        const urlParam = new URL(`https:${href}`).searchParams.get("uddg");
        if (urlParam) href = decodeURIComponent(urlParam);
      } catch {
        // keep original href
      }
    }

    if (title && href) {
      results.push({
        title,
        url: href,
        snippet: snippetEl.text().trim(),
      });
    }
  });

  return results;
}

/**
 * Main search function with fallback chain:
 * 1. Try DuckDuckGo HTML version
 * 2. Fallback to DuckDuckGo Lite version
 */
export async function searchDuckDuckGo(
  query: string,
  maxResults: number = 8
): Promise<SearchResult[]> {
  let results: SearchResult[] = [];

  // Try HTML version first
  try {
    results = await searchDDGHTML(query);
    if (results.length > 0) {
      return results.slice(0, maxResults);
    }
  } catch (e) {
    console.warn("DDG HTML search failed, trying lite:", e);
  }

  // Fallback to Lite version
  try {
    results = await searchDDGLite(query);
    if (results.length > 0) {
      return results.slice(0, maxResults);
    }
  } catch (e) {
    console.warn("DDG Lite search also failed:", e);
  }

  return [];
}

/**
 * Format search results as a readable string for the LLM
 */
export function formatSearchResults(
  results: SearchResult[],
  label: string
): string {
  if (results.length === 0) {
    return `### ${label}\nNo results found.\n\n`;
  }

  let output = `### ${label}\n`;
  results.forEach((r, i) => {
    output += `${i + 1}. **${r.title}**\n`;
    output += `   URL: ${r.url}\n`;
    if (r.snippet) {
      output += `   ${r.snippet}\n`;
    }
    output += `\n`;
  });
  return output + "\n";
}
