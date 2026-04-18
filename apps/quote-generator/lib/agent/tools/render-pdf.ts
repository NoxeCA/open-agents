import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { uploadBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { quoteFiles, quotes } from "@/lib/db/schema";
import { callPdfApi, PdfValidationError } from "@/lib/quote/render";
import { quoteDataSchema } from "@/lib/quote/schema";
import { nanoid } from "@/lib/util/ids";

import type { RenderPdfOutput } from "../tool-types";

export function renderPdfTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Render the current QuoteData to a PDF via the Noxe documents API, persist it to blob storage, and attach it to the quote. Call this after the quote has all mandatory fields, or after applying a patch the user asked for. Returns a `pdfUrl` the UI can load in the preview pane.",
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

      const parsed = quoteDataSchema.safeParse(row.data);
      if (!parsed.success) {
        const missingPaths = parsed.error.issues.map((i) =>
          i.path.join("."),
        );
        return {
          ok: false,
          error: "validation_failed",
          missingPaths,
        };
      }

      let pdf: ArrayBuffer | Uint8Array | Buffer;
      try {
        pdf = await callPdfApi(parsed.data);
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
        await db.insert(quoteFiles).values({
          id: pdfFileId,
          quoteId,
          kind: "pdf",
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
