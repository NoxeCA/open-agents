"use client";

import { AlertTriangle, Download, ExternalLink, FileText } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Json, ToolHeader, toolCardClassName, type ToolCallProps } from "./generic";

export function RenderPdfToolCall({
  input,
  output,
  state,
  quoteId,
}: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const layout =
    (input?.layout as string | undefined) ??
    (input?.layoutId as string | undefined);
  const pdfFileId = output?.pdfFileId as string | undefined;
  const blockingIssues = Array.isArray(output?.blockingIssues)
    ? (output.blockingIssues as string[])
    : [];
  const renderSummary =
    output?.renderSummary && typeof output.renderSummary === "object"
      ? (output.renderSummary as {
          pageCount?: number;
          pricingLayoutPolicy?: string;
          visibleSections?: Array<{ label?: string }>;
          serviceLayouts?: Array<{ name?: string; layout?: string }>;
          nonEmptyRegions?: Array<{ regionId?: string; blockCount?: number }>;
          consistencyWarnings?: string[];
        })
      : null;
  const canOpenPdf = Boolean(pdfFileId && quoteId);

  return (
    <Card className={toolCardClassName}>
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
          {pdfFileId ? (
            <span>PDF généré et prêt à ouvrir</span>
          ) : output?.error === "not_production_ready" ? (
            <span>La génération est bloquée tant que les points restants ne sont pas réglés</span>
          ) : (
            <span>
              Génération{layout ? ` avec la mise en page « ${layout} »` : ""}...
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-3">
        {canOpenPdf && (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a
                href={`/api/quotes/${quoteId}/pdfs/${pdfFileId}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-4" />
                Ouvrir le PDF
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href={`/api/quotes/${quoteId}/pdfs/${pdfFileId}?download=1`}
                download
              >
                <Download className="size-4" />
                Télécharger
              </a>
            </Button>
          </div>
        )}

        {renderSummary && (
          <div className="rounded-xl border border-border/60 bg-background/70 p-3 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{renderSummary.pageCount ?? "?"} pages</span>
              {renderSummary.pricingLayoutPolicy && (
                <span>layout: {renderSummary.pricingLayoutPolicy}</span>
              )}
            </div>
            {Array.isArray(renderSummary.visibleSections) &&
              renderSummary.visibleSections.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Sections:{" "}
                  {renderSummary.visibleSections
                    .map((section) => section.label)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            {Array.isArray(renderSummary.serviceLayouts) &&
              renderSummary.serviceLayouts.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {renderSummary.serviceLayouts.map((service, index) => (
                    <li key={`${service.name ?? "service"}-${index}`}>
                      {service.name ?? `Service ${index + 1}`} · {service.layout ?? "unknown"}
                    </li>
                  ))}
                </ul>
              )}
            {Array.isArray(renderSummary.nonEmptyRegions) &&
              renderSummary.nonEmptyRegions.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Zones enrichies:{" "}
                  {renderSummary.nonEmptyRegions
                    .map((region) =>
                      region.regionId
                        ? `${region.regionId}${typeof region.blockCount === "number" ? ` (${region.blockCount})` : ""}`
                        : null,
                    )
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            {Array.isArray(renderSummary.consistencyWarnings) &&
              renderSummary.consistencyWarnings.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2 py-2 text-xs text-amber-950">
                  {renderSummary.consistencyWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
          </div>
        )}

        {output?.error === "not_production_ready" &&
          blockingIssues.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-sm text-amber-950">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" />
                Encore bloqué avant la génération
              </div>
              <ul className="space-y-1.5">
                {blockingIssues.slice(0, 4).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

        {expanded && (
          <div className="space-y-2">
            {input !== undefined && (
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Entrée
                </p>
                <Json value={input} />
              </div>
            )}
            {output !== undefined && (
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Sortie
                </p>
                <Json value={output} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
