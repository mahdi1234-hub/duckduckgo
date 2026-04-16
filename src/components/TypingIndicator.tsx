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
      <div className="flex flex-col gap-2 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
            <span className="typing-dot w-2 h-2 rounded-full bg-stone-400" />
          </div>
          <span
            className="text-xs text-stone-400 uppercase tracking-widest ml-2"
            style={{ letterSpacing: "-0.025em" }}
          >
            Searching the web & analyzing...
          </span>
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
