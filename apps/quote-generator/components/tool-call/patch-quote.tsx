"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Json, ToolHeader, toolCardClassName, type ToolCallProps } from "./generic";

type PatchOp = {
  op?: string;
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
};

export function PatchQuoteToolCall({ input, output, state }: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const patches: PatchOp[] = Array.isArray(input?.patches)
    ? input.patches
    : Array.isArray(input?.ops)
      ? input.ops
      : [];

  return (
    <Card className={toolCardClassName}>
      <CardHeader className="px-3">
        <CardTitle className="text-xs font-normal">
          <ToolHeader
            name="patch_quote"
            state={state}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardTitle>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Pencil className="size-3.5" />
          <span>
            {patches.length} operation{patches.length === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 px-3">
          {patches.length > 0 && (
            <ul className="space-y-1 text-[11px]">
              {patches.slice(0, 20).map((p, i) => (
                <li key={i} className="font-mono text-muted-foreground">
                  <span className="text-foreground">{p.op ?? "op"}</span>{" "}
                  {p.path ?? ""}{" "}
                  {p.value !== undefined && (
                    <span>= {JSON.stringify(p.value)}</span>
                  )}
                </li>
              ))}
              {patches.length > 20 && (
                <li className="text-[11px] text-muted-foreground">
                  …and {patches.length - 20} more
                </li>
              )}
            </ul>
          )}
          {output !== undefined && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
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
