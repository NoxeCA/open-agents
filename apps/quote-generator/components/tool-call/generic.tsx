"use client";

import { ChevronDown, ChevronRight, Loader2, Wrench } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ToolCallProps = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
  state?: string;
  toolCallId?: string;
  onToolOutput?: (args: {
    tool?: string;
    toolCallId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any;
  }) => void;
};

export function stateBadgeClasses(state?: string) {
  switch (state) {
    case "output-available":
      return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "output-error":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    case "input-available":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
    case "input-streaming":
    default:
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
  }
}

export function ToolHeader({
  name,
  state,
  expanded,
  onToggle,
  meta,
}: {
  name: string;
  state?: string;
  expanded?: boolean;
  onToggle?: () => void;
  meta?: React.ReactNode;
}) {
  const isRunning = state === "input-streaming";
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 text-left"
    >
      {onToggle ? (
        expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        )
      ) : (
        <Wrench className="size-3.5 text-muted-foreground" />
      )}
      <span className="font-mono text-xs text-foreground">{name}</span>
      {isRunning && (
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      )}
      <span
        className={cn(
          "ml-auto rounded px-1.5 py-0.5 font-mono text-[10px]",
          stateBadgeClasses(state),
        )}
      >
        {state ?? "unknown"}
      </span>
      {meta}
    </button>
  );
}

export function Json({ value }: { value: unknown }) {
  if (value === undefined || value === null) return null;
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <pre className="max-h-64 overflow-auto rounded bg-background p-2 text-[11px] leading-snug">
      {text}
    </pre>
  );
}

export function GenericToolCall({
  name,
  input,
  output,
  state,
}: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="my-1 gap-2 py-2">
      <CardHeader className="px-3">
        <CardTitle className="text-xs font-normal">
          <ToolHeader
            name={name}
            state={state}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 px-3">
          {input !== undefined && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Input
              </p>
              <Json value={input} />
            </div>
          )}
          {output !== undefined && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Output
              </p>
              <Json value={output} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
