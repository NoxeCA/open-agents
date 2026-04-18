"use client";

import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Json, ToolHeader, type ToolCallProps } from "./generic";

export function ParseExcelToolCall({ input, output, state }: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const filename =
    (input?.filename as string | undefined) ??
    (input?.name as string | undefined);
  const sheetCount = Array.isArray(output?.sheetSummaries)
    ? output.sheetSummaries.length
    : undefined;
  return (
    <Card className="my-1 gap-2 py-2">
      <CardHeader className="px-3">
        <CardTitle className="text-xs font-normal">
          <ToolHeader
            name="parse_excel"
            state={state}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardTitle>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <FileSpreadsheet className="size-3.5" />
          <span className="truncate">{filename ?? "Excel file"}</span>
          {sheetCount !== undefined && (
            <span className="ml-auto font-mono text-[10px]">
              {sheetCount} sheet{sheetCount === 1 ? "" : "s"}
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
