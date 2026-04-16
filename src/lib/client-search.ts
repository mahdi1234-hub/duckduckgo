interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  error?: string;
}

async function fetchSearch(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) return [];
    const data: SearchResponse = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

function formatResults(results: SearchResult[], label: string): string {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Perform multiple DuckDuckGo searches from client-side via edge API
 * and return formatted results for the LLM.
 */
export async function performSearches(userQuery: string): Promise<string> {
  let allResults = "";

  // 1. Main search
  const mainResults = await fetchSearch(userQuery);
  allResults += formatResults(mainResults, "Main Web Search Results");

  await delay(800);

  // 2. Latest news, blogs, updates
  const newsResults = await fetchSearch(
    `${userQuery} latest news blog update announcement 2025 2026`
  );
  allResults += formatResults(newsResults, "Latest News, Blogs & Updates");

  await delay(800);

  // 3. Videos, research, reports
  const deepResults = await fetchSearch(
    `${userQuery} video tutorial PDF research report`
  );
  allResults += formatResults(deepResults, "Videos, Research & Reports");

  return allResults;
}
