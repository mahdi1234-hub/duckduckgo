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

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`");
}

/**
 * Search using public SearXNG instances (privacy-respecting meta search engine)
 * SearXNG aggregates results from many search engines including DuckDuckGo, Google, Bing, etc.
 */
const SEARXNG_INSTANCES = [
  "https://search.sapti.me",
  "https://searxng.site",
  "https://search.bus-hit.me",
  "https://priv.au",
  "https://searx.tiekoetter.com",
  "https://search.mdosch.de",
];

async function searchSearXNG(
  query: string,
  maxResults: number
): Promise<SearchResult[]> {
  for (const instance of SEARXNG_INSTANCES) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&engines=duckduckgo,google,bing&language=en`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": getRandomUserAgent(),
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results
          .slice(0, maxResults)
          .map(
            (r: { title?: string; url?: string; content?: string }) => ({
              title: decodeHTMLEntities(r.title || ""),
              url: r.url || "",
              snippet: decodeHTMLEntities(r.content || ""),
            })
          );
      }
    } catch {
      // Try next instance
      continue;
    }
  }
  return [];
}

/**
 * Search DuckDuckGo using the HTML version (works from non-cloud IPs)
 */
async function searchDDGHTML(
  query: string,
  maxResults: number
): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `q=${encodeURIComponent(query)}&b=`,
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

    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || "",
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Search using DuckDuckGo Lite version
 */
async function searchDDGLite(
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
      },
      body: body.toString(),
    });

    if (!response.ok || response.status === 202) return [];

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
  } catch {
    return [];
  }
}

/**
 * Main search function with fallback chain:
 * 1. Try SearXNG (meta search engine, works from cloud IPs)
 * 2. Try DuckDuckGo HTML Full version
 * 3. Try DuckDuckGo Lite version
 */
export async function searchDuckDuckGo(
  query: string,
  maxResults: number = 8
): Promise<SearchResult[]> {
  // Method 1: SearXNG (most reliable from cloud environments)
  let results = await searchSearXNG(query, maxResults);
  if (results.length > 0) return results;

  // Method 2: DDG HTML full version
  results = await searchDDGHTML(query, maxResults);
  if (results.length > 0) return results;

  // Method 3: DDG Lite version
  results = await searchDDGLite(query, maxResults);
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
