import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  searchDuckDuckGo,
  formatSearchResults,
} from "@/lib/duckduckgo-search";

const SYSTEM_PROMPT = `You are an elite AI-powered Search Specialist Agent called "Etheria Search". Your mission is to provide the most accurate, up-to-date, and comprehensive information on any topic the user asks about.

CORE DIRECTIVES:
1. You receive real-time web search results from DuckDuckGo. Use them as your PRIMARY source of truth.
2. Always reference and cite the actual search results provided to you.
3. Provide FRESH, UP-TO-DATE information. Prioritize the most recent sources.
4. Include clickable source links for every piece of information you provide.
5. Structure your responses clearly with markdown formatting.

RESPONSE STRUCTURE (always follow this):

## Overview
Brief summary of the topic based on search results.

## Top News
Latest news items found in the search results with dates and links.

## Key Findings
Detailed bullet points from multiple sources (articles, blogs, official docs).

## Top Blogs & Articles
Links to relevant blog posts and articles found.

## Videos & Media
Any video or multimedia content found (YouTube links, etc).

## Official Announcements & Updates
Any official announcements from companies, organizations, or governments.

## Data & Reports
Any PDFs, research papers, or data reports found.

## Analysis
Your synthesis and analysis of all the information gathered.

| Aspect | Details |
|--------|---------|
| Topic  | ... |
| Last Updated | ... |
| Key Trend | ... |

## Sources
Numbered list of ALL source URLs referenced in your response:
1. [Source Title](url) - brief description
2. [Source Title](url) - brief description

## Suggested Follow-ups
- Question 1 the user might want to explore
- Question 2 the user might want to explore
- Question 3 the user might want to explore
- Question 4 the user might want to explore
- Question 5 the user might want to explore

IMPORTANT RULES:
- If a section has no relevant results, write "No specific results found for this category." instead of making up information.
- Every link you provide MUST come from the actual search results given to you.
- Use markdown tables, task lists, footnotes, and strikethrough where appropriate.
- Format all URLs as clickable markdown links: [Title](url)
- Be context-aware: understand the user's intent and tailor your search analysis accordingly.`;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const cerebrasApiKey = process.env.CEREBRAS_API_KEY;
    if (!cerebrasApiKey) {
      return NextResponse.json(
        { error: "CEREBRAS_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Initialize Cerebras LLM via OpenAI-compatible API
    const llm = new ChatOpenAI({
      apiKey: cerebrasApiKey,
      model: "llama-3.1-8b",
      configuration: {
        baseURL: "https://api.cerebras.ai/v1",
      },
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Perform multiple diverse searches using custom DuckDuckGo scraper
    let allSearchResults = "";

    // 1. Main topic search
    const mainResults = await searchDuckDuckGo(userQuery, 8);
    allSearchResults += formatSearchResults(mainResults, "Web Search Results");

    await delay(500);

    // 2. Latest news search
    const newsResults = await searchDuckDuckGo(
      `${userQuery} latest news 2025 2026`,
      6
    );
    allSearchResults += formatSearchResults(newsResults, "Latest News");

    await delay(500);

    // 3. Blog posts and articles
    const blogResults = await searchDuckDuckGo(
      `${userQuery} blog post article analysis`,
      6
    );
    allSearchResults += formatSearchResults(blogResults, "Blog Posts & Articles");

    await delay(500);

    // 4. Videos and multimedia
    const videoResults = await searchDuckDuckGo(
      `${userQuery} video youtube tutorial`,
      5
    );
    allSearchResults += formatSearchResults(videoResults, "Videos & Media");

    await delay(500);

    // 5. Official announcements and updates
    const announcementResults = await searchDuckDuckGo(
      `${userQuery} official announcement update release`,
      5
    );
    allSearchResults += formatSearchResults(
      announcementResults,
      "Official Announcements & Updates"
    );

    await delay(500);

    // 6. PDFs, research papers, reports
    const pdfResults = await searchDuckDuckGo(
      `${userQuery} PDF research report whitepaper`,
      5
    );
    allSearchResults += formatSearchResults(
      pdfResults,
      "Research Papers & Reports"
    );

    // Build conversation messages with search context
    const langchainMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages
        .slice(0, -1)
        .map((msg: { role: string; content: string }) => {
          if (msg.role === "user") {
            return new HumanMessage(msg.content);
          }
          return new AIMessage(msg.content);
        }),
      new HumanMessage(
        `User Question: ${userQuery}\n\n` +
          `=== LIVE DUCKDUCKGO SEARCH RESULTS ===\n\n${allSearchResults}\n` +
          `=== END OF SEARCH RESULTS ===\n\n` +
          `Instructions: Based on the above REAL search results from DuckDuckGo, provide a comprehensive response following the exact structure defined in your system prompt. ` +
          `Make sure to:\n` +
          `1. Reference actual URLs and titles from the search results above\n` +
          `2. Organize findings into the categories: Top News, Key Findings, Blogs & Articles, Videos, Announcements, Reports\n` +
          `3. Include a numbered Sources section with all URLs\n` +
          `4. Add 5 suggested follow-up questions\n` +
          `5. Use GFM markdown: tables, task lists (- [ ] item), footnotes, ~~strikethrough~~, and [autolinks](url)\n` +
          `6. If certain categories have no results, note that explicitly.`
      ),
    ];

    // Get AI response
    const response = await llm.invoke(langchainMessages);

    return NextResponse.json({
      role: "assistant",
      content: response.content,
    });
  } catch (error: unknown) {
    console.error("Agent error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
