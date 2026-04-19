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
