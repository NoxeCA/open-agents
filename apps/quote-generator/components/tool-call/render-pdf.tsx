"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Json, ToolHeader, type ToolCallProps } from "./generic";

export function RenderPdfToolCall({ input, output, state }: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const layout =
    (input?.layout as string | undefined) ??
    (input?.layoutId as string | undefined);
  const fileId = output?.fileId as string | undefined;
  return (
    <Card className="my-1 gap-2 py-2">
      <CardHeader className="px-3">
        <CardTitle className="text-xs font-normal">
          <ToolHeader
            name="render_pdf"
            state={state}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardTitle>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="size-3.5" />
          {fileId ? (
            <span>PDF rendered</span>
          ) : (
            <span>
              Rendering{layout ? ` with layout “${layout}”` : ""}…
            </span>
          )}
        </div>
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
