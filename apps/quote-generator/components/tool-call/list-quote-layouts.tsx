"use client";

import { LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Json, ToolHeader, type ToolCallProps } from "./generic";

type Layout = {
  id?: string;
  name?: string;
  description?: string;
};

export function ListQuoteLayoutsToolCall({
  input,
  output,
  state,
}: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const layouts: Layout[] = Array.isArray(output?.layouts)
    ? output.layouts
    : Array.isArray(output)
      ? output
      : [];
  return (
    <Card className="my-1 gap-2 py-2">
      <CardHeader className="px-3">
        <CardTitle className="text-xs font-normal">
          <ToolHeader
            name="list_quote_layouts"
            state={state}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardTitle>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <LayoutTemplate className="size-3.5" />
          <span>
            {layouts.length} layout{layouts.length === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 px-3">
          {layouts.length > 0 ? (
            <ul className="space-y-1 text-xs">
              {layouts.map((l, i) => (
                <li
                  // eslint-disable-next-line react/no-array-index-key
                  key={l.id ?? i}
                  className="rounded border px-2 py-1"
                >
                  <div className="font-medium">
                    {l.name ?? l.id ?? `Layout ${i + 1}`}
                  </div>
                  {l.description && (
                    <div className="text-muted-foreground">
                      {l.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Json value={output} />
          )}
          {input !== undefined && Object.keys(input ?? {}).length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Input
              </p>
              <Json value={input} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
