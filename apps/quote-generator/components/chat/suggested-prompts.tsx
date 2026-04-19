"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WorkspacePromptSuggestion } from "@/lib/quote/workspace-summary";

type Props = {
  suggestions: WorkspacePromptSuggestion[];
  onPick: (prompt: string) => void;
  layout?: "cards" | "chips";
};

export function SuggestedPrompts({
  suggestions,
  onPick,
  layout = "chips",
}: Props) {
  if (suggestions.length === 0) return null;

  if (layout === "cards") {
    return (
      <div
        className="flex w-full gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
        }}
      >
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onPick(suggestion.prompt)}
            className="group min-w-[200px] shrink-0 rounded-xl border border-border/50 bg-card/30 p-4 text-left text-[12px] leading-relaxed text-muted-foreground shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/60 hover:text-foreground hover:shadow-[var(--shadow-float)] sm:min-w-0 sm:shrink sm:text-[13px]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <Sparkles className="size-3.5" />
                Suggested next step
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {suggestion.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {suggestion.description}
            </p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex w-full gap-2.5 overflow-x-auto pb-1"
      style={{
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
      }}
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          onClick={() => onPick(suggestion.prompt)}
          className={cn(
            "inline-flex h-auto w-auto shrink-0 items-center rounded-xl border border-border/50 bg-card/30 px-4 py-3 text-left text-[12px] leading-relaxed text-muted-foreground shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/60 hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="size-3.5" />
            <span className="max-w-[18rem] truncate font-medium">
              {suggestion.label}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
