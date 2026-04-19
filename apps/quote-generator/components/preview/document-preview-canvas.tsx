"use client";

import { Renderer } from "@json-render/react";

import { quoteDocumentPreviewRegistry } from "@/lib/quote/document/preview-registry";

export function DocumentPreviewCanvas({
  spec,
}: {
  spec: Record<string, unknown> | null | undefined;
}) {
  if (!spec) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-black/10 bg-white/70 px-6 py-10 text-center text-sm leading-7 text-muted-foreground">
        Compose the proposal document to generate a live preview.
      </div>
    );
  }

  return (
    <div className="rounded-[1.8rem] border border-black/6 bg-[linear-gradient(180deg,rgba(245,242,236,0.96),rgba(236,232,224,0.95))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <Renderer spec={spec as never} registry={quoteDocumentPreviewRegistry} />
    </div>
  );
}
