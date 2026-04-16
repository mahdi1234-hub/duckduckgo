"use client";

import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUERIES = [
  "What are the latest AI breakthroughs in 2026?",
  "Top tech news this week",
  "Best new programming frameworks in 2025-2026",
  "Latest updates on climate change policies",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div
      className="flex flex-col h-screen bg-[#EAE8E2] text-stone-800 relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-stone-300/50 px-6 py-4 md:px-12">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-stone-200"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1
                className="text-lg font-light text-stone-900"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "-0.05em",
                }}
              >
                Etheria Search
              </h1>
              <p
                className="text-[10px] uppercase tracking-widest text-stone-400"
                style={{ letterSpacing: "-0.025em" }}
              >
                AI-Powered Research Agent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] uppercase tracking-widest text-stone-400 hidden md:inline"
              style={{ letterSpacing: "-0.025em" }}
            >
              Powered by Cerebras + DuckDuckGo
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 reveal-item reveal-active">
              {/* Welcome Section */}
              <div className="text-center space-y-4 max-w-2xl">
                <div className="w-16 h-16 rounded-full bg-stone-300/50 flex items-center justify-center mx-auto mb-6">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-stone-500"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <h2
                  className="text-3xl md:text-5xl font-light text-stone-900 leading-tight"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "-0.05em",
                  }}
                >
                  What would you like to{" "}
                  <span className="font-normal">discover</span> today?
                </h2>
                <p
                  className="text-stone-500 text-lg leading-relaxed"
                  style={{ letterSpacing: "-0.025em" }}
                >
                  I search the web in real-time to bring you the latest news,
                  articles, blogs, and insights on any topic.
                </p>
              </div>

              {/* Suggested Queries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTED_QUERIES.map((query, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(query)}
                    className="group text-left p-4 rounded-xl border border-stone-300/50 hover:border-stone-400/50 hover:bg-stone-200/50 transition-all duration-300"
                    style={{ animationDelay: `${(i + 1) * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-stone-400 text-xs mt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p
                        className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors"
                        style={{ letterSpacing: "-0.025em" }}
                      >
                        {query}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-8 pt-8 border-t border-stone-300/50 mt-4">
                <div className="text-center">
                  <span
                    className="text-2xl font-light text-stone-900"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "-0.05em",
                    }}
                  >
                    Real-time
                  </span>
                  <p
                    className="text-[10px] uppercase text-stone-400 mt-1"
                    style={{ letterSpacing: "-0.025em" }}
                  >
                    Web Search
                  </p>
                </div>
                <div className="text-center">
                  <span
                    className="text-2xl font-light text-stone-900"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "-0.05em",
                    }}
                  >
                    Multi-source
                  </span>
                  <p
                    className="text-[10px] uppercase text-stone-400 mt-1"
                    style={{ letterSpacing: "-0.025em" }}
                  >
                    Coverage
                  </p>
                </div>
                <div className="text-center">
                  <span
                    className="text-2xl font-light text-stone-900"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "-0.05em",
                    }}
                  >
                    AI-Enhanced
                  </span>
                  <p
                    className="text-[10px] uppercase text-stone-400 mt-1"
                    style={{ letterSpacing: "-0.025em" }}
                  >
                    Analysis
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              index={index}
            />
          ))}

          {isLoading && <TypingIndicator />}

          {error && (
            <div className="fade-in-up flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span style={{ letterSpacing: "-0.025em" }}>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-stone-300/50 px-6 py-4 md:px-12 bg-[#EAE8E2]">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... I'll search the web for the latest information"
                rows={1}
                className="w-full resize-none rounded-xl border border-stone-300/50 bg-white/60 px-5 py-3.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 transition-all backdrop-blur-sm"
                style={{
                  letterSpacing: "-0.025em",
                  fontFamily: "'Inter', sans-serif",
                  minHeight: "48px",
                  maxHeight: "120px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "48px";
                  target.style.height = target.scrollHeight + "px";
                }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-stone-800 text-stone-100 flex items-center justify-center hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <svg
                  className="animate-spin"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
          <div className="flex items-center justify-between mt-3">
            <p
              className="text-[10px] text-stone-400"
              style={{ letterSpacing: "-0.025em" }}
            >
              {"// Because true power is intelligent foresight."}
            </p>
            <p
              className="text-[10px] text-stone-400"
              style={{ letterSpacing: "-0.025em" }}
            >
              Etheria Search Agent &copy; 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
