"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import type { PatchQuoteOp, PatchQuoteOutput } from "@/lib/agent/tool-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Json,
  ToolHeader,
  toolCardClassName,
  type ToolCallProps,
} from "./generic";

type PatchQuoteSuccessOutput = Extract<PatchQuoteOutput, { ok: true }>;

export function PatchQuoteToolCall({ input, output, state }: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const patches: PatchQuoteOp[] = Array.isArray(input?.patches)
    ? input.patches
    : Array.isArray(input?.ops)
      ? input.ops
      : [];
  const patchOutput =
    output && typeof output === "object" ? (output as PatchQuoteOutput) : null;
  const successfulOutput =
    patchOutput && patchOutput.ok
      ? (patchOutput as PatchQuoteSuccessOutput)
      : null;
  const resolvedPaths = Array.isArray(successfulOutput?.resolvedPaths)
    ? successfulOutput.resolvedPaths
    : [];
  const touchedRegions = Array.isArray(successfulOutput?.touchedRegions)
    ? successfulOutput.touchedRegions
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
          {touchedRegions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Regions
              </p>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                {touchedRegions.map((region, index) => (
                  <li
                    key={`${region.regionId ?? "region"}-${index}`}
                    className="rounded-md border border-border/60 bg-background/70 px-2 py-1.5"
                  >
                    <div className="font-mono text-foreground">
                      {region.regionId ?? "region"}
                    </div>
                    <div>
                      {region.pageTitle ?? "Document page"}
                      {typeof region.pageStart === "number" &&
                      typeof region.pageEnd === "number"
                        ? ` · p.${region.pageStart}${region.pageStart === region.pageEnd ? "" : `-${region.pageEnd}`}`
                        : ""}
                    </div>
                    {Array.isArray(region.patchPaths) &&
                      region.patchPaths.length > 0 && (
                        <div className="font-mono text-[10px]">
                          target: {region.patchPaths.join(", ")}
                        </div>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resolvedPaths.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Resolved Paths
              </p>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                {resolvedPaths.slice(0, 10).map((path, index) => (
                  <li key={`${path}-${index}`} className="font-mono">
                    {path}
                  </li>
                ))}
                {resolvedPaths.length > 10 && (
                  <li className="text-[11px] text-muted-foreground">
                    …and {resolvedPaths.length - 10} more
                  </li>
                )}
              </ul>
            </div>
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
