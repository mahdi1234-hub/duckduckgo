import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

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
- Be context-aware: understand the user's intent and tailor your search analysis accordingly.
- Categorize each search result into the appropriate section based on the URL domain and content.`;

async function retrySearch(
  tool: DuckDuckGoSearch,
  query: string,
  retries: number = 3,
  delayMs: number = 2000
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await tool.invoke(query);
      if (result && result.length > 20) return result;
    } catch (error) {
      console.warn(`Search attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, searchResults: clientSearchResults } = body;

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

    const llm = new ChatOpenAI({
      apiKey: cerebrasApiKey,
      model: "llama-3.1-8b",
      configuration: {
        baseURL: "https://api.cerebras.ai/v1",
      },
      temperature: 0.7,
      maxTokens: 4096,
    });

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Use client-provided search results if available, otherwise search server-side
    let formattedResults = "";
    
    if (clientSearchResults && clientSearchResults.length > 100) {
      // Client already performed the search
      formattedResults = clientSearchResults;
    } else {
      // Server-side search using LangChain DuckDuckGo tool with retry
      const searchTool = new DuckDuckGoSearch({ maxResults: 10 });
      
      // Single comprehensive search to stay within rate limits
      const searchQuery = `${userQuery} latest news updates articles blogs 2025 2026`;
      const results = await retrySearch(searchTool, searchQuery);
      
      if (results) {
        formattedResults = `### DuckDuckGo Web Search Results\n${results}\n`;
      } else {
        formattedResults = "Search results temporarily unavailable. Please provide information based on your knowledge.";
      }
    }

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
          `=== LIVE DUCKDUCKGO SEARCH RESULTS (${new Date().toISOString()}) ===\n\n${formattedResults}\n` +
          `=== END OF SEARCH RESULTS ===\n\n` +
          `Instructions: Based on the above search results, provide a comprehensive response following the exact structure in your system prompt. ` +
          `Reference actual URLs and titles. Categorize findings into the sections. Include a Sources section. Add 5 follow-up questions. ` +
          `Use GFM markdown features: tables, task lists, strikethrough, and clickable links.`
      ),
    ];

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
