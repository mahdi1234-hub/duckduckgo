import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

const SYSTEM_PROMPT = `You are an elite AI-powered Search Specialist Agent. Your mission is to provide the most accurate, up-to-date, and comprehensive information on any topic the user asks about.

CORE DIRECTIVES:
1. You have access to a DuckDuckGo web search tool. When a user asks a question, I will search the web for you and include the results.
2. Provide FRESH, UP-TO-DATE information. Prioritize the most recent sources from 2025-2026.
3. Include clickable source links for every piece of information you provide.
4. Structure your responses clearly with markdown formatting.

RESPONSE FORMAT:
- Use headers (##, ###) to organize information
- Include bullet points for key findings
- Always provide source URLs as markdown links [Source Title](url)
- Add a "## Sources" section at the end with all referenced links
- Use tables when comparing information
- Include relevant dates to show how current the information is
- Use footnotes where appropriate
- Use strikethrough for outdated information when comparing old vs new
- Use task lists for actionable items

FOLLOW-UP SUGGESTIONS:
- Always end with a "## Suggested Follow-ups" section
- Provide 3-5 related questions the user might want to explore next

PERSONALITY:
- Be thorough and professional
- Provide context and analysis, not just raw data
- Suggest related topics the user might want to explore
- Be transparent about the recency and reliability of sources`;

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
      openAIApiKey: cerebrasApiKey,
      modelName: "llama-3.1-8b",
      configuration: {
        baseURL: "https://api.cerebras.ai/v1",
      },
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Initialize DuckDuckGo Search tool
    const searchTool = new DuckDuckGoSearch({ maxResults: 10 });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Perform multiple searches to get comprehensive results
    let searchResults = "";
    try {
      // Main topic search
      const mainResults = await searchTool.invoke(userQuery);
      searchResults += `### Web Search Results for "${userQuery}":\n${mainResults}\n\n`;

      // Search for latest news
      const newsResults = await searchTool.invoke(`${userQuery} latest news 2025 2026`);
      searchResults += `### Latest News Results:\n${newsResults}\n\n`;

      // Search for articles and blogs
      const articleResults = await searchTool.invoke(`${userQuery} articles blog updates`);
      searchResults += `### Articles & Blog Results:\n${articleResults}\n\n`;
    } catch (searchError) {
      console.error("Search error:", searchError);
      searchResults = "Search results were partially unavailable. Providing information based on available data.\n";
    }

    // Build conversation messages with search context
    const langchainMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages.slice(0, -1).map((msg: { role: string; content: string }) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        }
        return new AIMessage(msg.content);
      }),
      new HumanMessage(
        `User Question: ${userQuery}\n\n` +
        `Here are the latest search results from the web to help you answer:\n\n${searchResults}\n\n` +
        `Based on these search results, please provide a comprehensive, well-structured answer with:\n` +
        `1. Key findings with source links\n` +
        `2. Latest news and updates\n` +
        `3. Multiple perspectives from different sources\n` +
        `4. A sources section with all links\n` +
        `5. Suggested follow-up questions\n` +
        `Format everything in clean markdown with GFM features (tables, task lists, footnotes, strikethrough, autolinks).`
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
