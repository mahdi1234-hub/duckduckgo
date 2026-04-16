"use client";

import React from "react";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-4 fade-in-up">
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
      <div className="flex flex-col gap-3 py-3 max-w-md">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
          </div>
        </div>

        {/* Search progress indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ letterSpacing: "-0.025em" }}>
              Searching web for latest information...
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["News", "Articles", "Blogs", "Videos", "Reports", "Updates"].map(
              (source, i) => (
                <span
                  key={source}
                  className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-stone-300/50 text-stone-400 shimmer-loading"
                  style={{
                    animationDelay: `${i * 200}ms`,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {source}
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <div className="h-2 w-32 rounded-full shimmer-loading" />
          <div className="h-2 w-20 rounded-full shimmer-loading" />
          <div className="h-2 w-24 rounded-full shimmer-loading" />
        </div>
      </div>
    </div>
  );
}
