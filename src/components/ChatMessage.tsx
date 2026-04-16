"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  index: number;
}

export default function ChatMessage({
  role,
  content,
  index,
}: ChatMessageProps) {
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
                    className="text-amber-800 underline underline-offset-2 hover:text-amber-900 transition-colors inline-flex items-center gap-1"
                    {...props}
                  >
                    {children}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="inline-block flex-shrink-0"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ),
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-3 rounded-lg border border-stone-300/50">
                    <table
                      className="w-full border-collapse text-sm"
                      {...props}
                    >
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children, ...props }) => (
                  <thead className="bg-stone-200/60" {...props}>
                    {children}
                  </thead>
                ),
                th: ({ children, ...props }) => (
                  <th
                    className="text-left px-4 py-2.5 font-medium text-stone-700 border-b border-stone-300/50"
                    style={{ letterSpacing: "-0.025em" }}
                    {...props}
                  >
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td
                    className="px-4 py-2 text-stone-600 border-b border-stone-200/50"
                    {...props}
                  >
                    {children}
                  </td>
                ),
                input: ({ ...props }) => (
                  <input
                    {...props}
                    disabled={false}
                    className="mr-2 accent-stone-600 cursor-pointer"
                  />
                ),
                h2: ({ children, ...props }) => (
                  <h2
                    className="text-xl font-light text-stone-900 mt-6 mb-3 pb-2 border-b border-stone-300/50 flex items-center gap-2"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "-0.04em",
                    }}
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3
                    className="text-base font-medium text-stone-800 mt-4 mb-2"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "-0.03em",
                    }}
                    {...props}
                  >
                    {children}
                  </h3>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote
                    className="border-l-3 border-stone-400 pl-4 my-3 text-stone-500 italic bg-stone-100/50 py-2 rounded-r-lg"
                    {...props}
                  >
                    {children}
                  </blockquote>
                ),
                code: ({
                  className,
                  children,
                  ...props
                }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code
                        className="bg-stone-200/60 px-1.5 py-0.5 rounded text-sm font-mono text-stone-700"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                ol: ({ children, ...props }) => (
                  <ol
                    className="list-decimal list-inside space-y-1 my-2 text-stone-600"
                    {...props}
                  >
                    {children}
                  </ol>
                ),
                ul: ({ children, ...props }) => (
                  <ul
                    className="list-disc list-inside space-y-1 my-2 text-stone-600"
                    {...props}
                  >
                    {children}
                  </ul>
                ),
                li: ({ children, ...props }) => (
                  <li
                    className="text-stone-600 leading-relaxed"
                    style={{ letterSpacing: "-0.025em" }}
                    {...props}
                  >
                    {children}
                  </li>
                ),
                hr: () => (
                  <hr className="border-none border-t border-stone-300/50 my-6" />
                ),
                del: ({ children, ...props }) => (
                  <del className="text-stone-400 line-through" {...props}>
                    {children}
                  </del>
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
