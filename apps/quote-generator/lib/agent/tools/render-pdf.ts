import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { uploadBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { quoteFiles, quotes } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import { assessQuoteProductionReadiness } from "@/lib/quote/render-readiness";
import { callPdfApi, PdfValidationError } from "@/lib/quote/render";
import type { QuoteData } from "@/lib/quote/schema";
import { nanoid } from "@/lib/util/ids";

import type { RenderPdfOutput } from "../tool-types";

export function renderPdfTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Render the current QuoteData to a PDF via the Noxe documents API, persist it to blob storage, and attach it to the quote. Call this only when the quote is production-ready: required fields are filled, no placeholder text remains, and unresolved confirmations have already been patched. Returns a `pdfUrl` the UI can load in the preview pane.",
    inputSchema: z.object({}),
    execute: async (): Promise<RenderPdfOutput> => {
      const [row] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!row) {
        return { ok: false, error: "Quote not found" };
      }

      const normalizedData = normalizeQuoteData(
        row.data as Partial<QuoteData>,
      );
      const readiness = assessQuoteProductionReadiness(normalizedData);
      if (readiness.renderReadiness === "blocked" || !readiness.parsedData) {
        return {
          ok: false,
          error: "not_production_ready",
          missingPaths: readiness.blockers,
          blockingIssues: readiness.blockingIssues,
        };
      }

      let pdf: ArrayBuffer | Uint8Array | Buffer;
      try {
        pdf = await callPdfApi(readiness.parsedData);
      } catch (e) {
        if (e instanceof PdfValidationError) {
          return {
            ok: false,
            error: "pdf_api_validation",
            missingPaths: e.missingPaths,
          };
        }
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: message || "Unknown PDF error" };
      }

      const pdfFileId = nanoid();
      const { url, pathname, size } = await uploadBlob({
        pathname: `quotes/${quoteId}/pdfs/${pdfFileId}.pdf`,
        body: pdf,
        contentType: "application/pdf",
      });

      const baseName =
        typeof row.title === "string" && row.title.length > 0
          ? row.title
          : `quote-${quoteId}`;

      try {
        if (JSON.stringify(readiness.normalizedData) !== JSON.stringify(row.data)) {
          await persistQuoteData({
            quote: {
              id: row.id,
              title: row.title,
              lang: row.lang,
            },
            data: readiness.normalizedData,
          });
        }

        await db.insert(quoteFiles).values({
          id: pdfFileId,
          quoteId,
          kind: "pdf",
          mediaType: "application/pdf",
          blobUrl: url,
          blobPathname: pathname,
          filename: `${baseName}.pdf`,
          sizeBytes: size,
        });

        await db
          .update(quotes)
          .set({ lastRenderedAt: new Date() })
          .where(eq(quotes.id, quoteId));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          ok: false,
          error: `Failed to persist PDF record: ${message}`,
        };
      }

      return {
        ok: true,
        pdfFileId,
        pdfUrl: `/api/quotes/${quoteId}/pdfs/${pdfFileId}`,
      };
    },
  });
}
