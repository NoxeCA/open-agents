"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldInspector } from "@/components/preview/field-inspector";
import { PdfIframe } from "@/components/preview/pdf-iframe";
import { RegenerateButton } from "@/components/preview/regenerate-button";
import { patchScalarField, requestRegenerate } from "./actions";

type Props = {
  quoteId: string;
  pdfFileId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quoteData: any;
};

export function PreviewPane({ quoteId, pdfFileId, quoteData }: Props) {
  const pdfSrc = pdfFileId ? `/api/quotes/${quoteId}/pdfs/${pdfFileId}` : null;

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex items-center gap-2">
          <RegenerateButton
            onRegenerate={async () => {
              await requestRegenerate(quoteId);
            }}
          />
          <FieldInspector
            quoteData={quoteData}
            onPatchScalar={async (path, value) => {
              await patchScalarField(quoteId, path, value);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          {pdfFileId ? (
            <Button asChild size="sm" variant="outline">
              <a
                href={`/api/quotes/${quoteId}/pdfs/${pdfFileId}?download=1`}
                download
              >
                <Download className="size-4" />
                Download
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <Download className="size-4" />
              Download
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {pdfSrc ? (
          <PdfIframe src={pdfSrc} />
        ) : (
          <div className="flex h-full items-center justify-center p-10 text-center text-sm text-muted-foreground">
            <div>
              <p className="mb-1 font-medium text-foreground">No PDF yet</p>
              <p>
                Chat with the assistant on the left, or ask it to &quot;render
                the PDF&quot; once your quote has enough details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
