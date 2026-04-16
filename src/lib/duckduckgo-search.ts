export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Search DuckDuckGo using the HTML version (most reliable)
 */
async function searchHTMLFull(
  query: string,
  maxResults: number
): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const ua = getRandomUserAgent();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": ua,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: `q=${encodeURIComponent(query)}&b=`,
    });

    if (!response.ok) {
      console.warn(`DDG HTML returned status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // Parse result links
    const resultRegex =
      /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex =
      /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    const links: { url: string; title: string }[] = [];
    let match;

    while ((match = resultRegex.exec(html)) !== null) {
      let href = match[1];
      // DDG wraps URLs in a redirect
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

    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || "",
      });
    }

    return results;
  } catch (error) {
    console.error("DDG HTML Full search error:", error);
    return [];
  }
}

/**
 * Fallback: search using DuckDuckGo Lite version
 */
async function searchHTMLLite(
  query: string,
  maxResults: number
): Promise<SearchResult[]> {
  try {
    const body = new URLSearchParams({ q: query, kl: "" });
    const response = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": getRandomUserAgent(),
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.5",
      },
      body: body.toString(),
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

    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || "",
      });
    }

    return results;
  } catch (error) {
    console.error("DDG Lite search error:", error);
    return [];
  }
}

/**
 * Main search function with fallback chain:
 * 1. Try DuckDuckGo HTML Full version
 * 2. Fallback to DuckDuckGo Lite version
 */
export async function searchDuckDuckGo(
  query: string,
  maxResults: number = 8
): Promise<SearchResult[]> {
  // Method 1: HTML full version (most reliable)
  let results = await searchHTMLFull(query, maxResults);
  if (results.length > 0) return results;

  // Method 2: Lite version fallback
  results = await searchHTMLLite(query, maxResults);
  return results;
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
