"use client";

import { useState } from "react";
import { Download, Eye, EyeOff, ExternalLink, FileText } from "lucide-react";
import { OptionalSectionsTeaser } from "@/components/preview/optional-sections-teaser";
import { Button } from "@/components/ui/button";
import { FieldInspector } from "@/components/preview/field-inspector";
import { PdfIframe } from "@/components/preview/pdf-iframe";
import { RegenerateButton } from "@/components/preview/regenerate-button";
import { SectionLibraryDialog } from "@/components/preview/section-library-dialog";
import { patchScalarField, requestRegenerate, toggleOptionalSection } from "./actions";
import type { OptionalSectionKey } from "@/lib/quote/section-library";

type Props = {
  quoteId: string;
  pdfFileId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quoteData: any;
  onQuoteUpdated: () => void | Promise<void>;
  onDraftAssistantPrompt: (prompt: string) => void;
};

export function PreviewPane({
  quoteId,
  pdfFileId,
  quoteData,
  onQuoteUpdated,
  onDraftAssistantPrompt,
}: Props) {
  const pdfSrc = pdfFileId ? `/api/quotes/${quoteId}/pdfs/${pdfFileId}` : null;
  const [loadedPreviewFileId, setLoadedPreviewFileId] = useState<string | null>(
    null,
  );
  const showEmbeddedPreview =
    pdfFileId !== null && loadedPreviewFileId === pdfFileId;
  const handleToggleSection = async (
    key: OptionalSectionKey,
    enabled: boolean,
  ) => {
    await toggleOptionalSection(quoteId, key, enabled);
    await onQuoteUpdated();
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex items-center gap-2">
          <RegenerateButton
            onRegenerate={async () => {
              await requestRegenerate();
            }}
          />
          <SectionLibraryDialog
            quoteData={quoteData}
            onToggleSection={handleToggleSection}
            onDraftAssistantPrompt={onDraftAssistantPrompt}
          />
          <FieldInspector
            quoteData={quoteData}
            onPatchScalar={async (path, value) => {
              await patchScalarField(quoteId, path, value);
              await onQuoteUpdated();
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          {pdfFileId ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setLoadedPreviewFileId((current) =>
                    current === pdfFileId ? null : pdfFileId,
                  )
                }
              >
                {showEmbeddedPreview ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
                {showEmbeddedPreview ? "Hide preview" : "Load preview"}
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`/api/quotes/${quoteId}/pdfs/${pdfFileId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-4" />
                  Open
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`/api/quotes/${quoteId}/pdfs/${pdfFileId}?download=1`}
                  download
                >
                  <Download className="size-4" />
                  Download
                </a>
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <Download className="size-4" />
              Download
            </Button>
          )}
        </div>
      </div>
      {!showEmbeddedPreview && (
        <OptionalSectionsTeaser
          quoteData={quoteData}
          onToggleSection={handleToggleSection}
          onDraftAssistantPrompt={onDraftAssistantPrompt}
        />
      )}
      <div className="flex-1 overflow-hidden">
        {pdfSrc && showEmbeddedPreview ? (
          <PdfIframe src={pdfSrc} />
        ) : pdfSrc ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="w-full max-w-md rounded-3xl border bg-background p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-foreground p-3 text-background">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Latest PDF is ready
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The embedded viewer stays unloaded until you open it, which
                    keeps the editor responsive while you work in chat.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setLoadedPreviewFileId(pdfFileId)}>
                  <Eye className="size-4" />
                  Load embedded preview
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={`/api/quotes/${quoteId}/pdfs/${pdfFileId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Open in new tab
                  </a>
                </Button>
              </div>
            </div>
          </div>
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
