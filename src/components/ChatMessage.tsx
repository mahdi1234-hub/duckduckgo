"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  index: number;
}

export default function ChatMessage({ role, content, index }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`fade-in-up flex w-full gap-4 ${isUser ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-stone-600"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
      )}

      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-stone-800 text-stone-100 rounded-2xl rounded-br-sm px-5 py-3"
            : "bg-transparent"
        }`}
      >
        {isUser ? (
          <p
            className="text-sm leading-relaxed"
            style={{ letterSpacing: "-0.025em" }}
          >
            {content}
          </p>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 underline underline-offset-2 hover:text-amber-900 transition-colors"
                    {...props}
                  >
                    {children}
                  </a>
                ),
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="w-full border-collapse text-sm" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                input: ({ ...props }) => (
                  <input
                    {...props}
                    disabled={false}
                    className="mr-2 accent-stone-600"
                  />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-stone-300"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
