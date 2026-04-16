# Etheria Search Agent

An AI-powered search specialist that provides up-to-date information from multiple web sources using **LangChain**, **DuckDuckGo Search**, and **Cerebras AI** (Llama 3.1 8B).

## Features

- **Real-time Web Search**: Uses DuckDuckGo to search the web for the latest information without any API keys
- **Multi-source Coverage**: Searches for news, articles, blogs, videos, PDFs, and official documentation
- **AI-Enhanced Analysis**: Powered by Cerebras AI with Llama 3.1 8B for intelligent summarization and analysis
- **Rich Markdown Output**: Full GFM support with tables, task lists, footnotes, strikethrough, and autolinks
- **Clickable Source Links**: All information includes source URLs that open in new tabs
- **Follow-up Suggestions**: AI suggests related topics to explore after each response
- **Elegant UI**: Etheria-inspired design with smooth animations, DM Sans typography, and a warm stone color palette

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **AI/LLM**: Cerebras AI (Llama 3.1 8B) via LangChain
- **Search**: DuckDuckGo Search via `@langchain/community`
- **Markdown**: `react-markdown` + `remark-gfm` for GitHub Flavored Markdown
- **Styling**: Tailwind CSS v4 with custom Etheria theme
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/mahdi1234-hub/duckduckgo.git
   cd duckduckgo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Cerebras API key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CEREBRAS_API_KEY` | Your Cerebras AI API key |

## How It Works

1. User submits a question through the chat interface
2. The agent performs multiple DuckDuckGo searches (main topic, latest news, articles/blogs)
3. Search results are fed to Cerebras AI (Llama 3.1 8B) as context
4. The AI analyzes and synthesizes the information into a comprehensive, well-structured response
5. Response includes source links, tables, and follow-up suggestions

## License

MIT
