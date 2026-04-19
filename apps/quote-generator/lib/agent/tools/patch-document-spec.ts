import { tool } from "ai";
import { applyPatch as applyJsonPatch } from "fast-json-patch";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import {
  buildQuoteDocumentState,
  summarizeQuoteDocumentState,
} from "@/lib/quote/document/builder";
import { quoteDocumentStateSchema } from "@/lib/quote/document/catalog";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import type { QuoteData } from "@/lib/quote/schema";

import type {
  Operation,
  PatchDocumentSpecOutput,
  PatchQuoteIssue,
} from "../tool-types";

const opSchema = z.object({
  op: z.enum(["add", "replace", "remove", "move", "copy", "test"]),
  path: z
    .string()
    .describe(
      "JSON pointer path into the quote document state, e.g. `/theme` or `/sections/1/title`. Do not patch `/spec` directly.",
    ),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

function validateDocumentPatch(value: unknown): PatchQuoteIssue[] {
  const parsed = quoteDocumentStateSchema.safeParse(value);
  if (parsed.success) {
    return [];
  }

  return parsed.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function patchDocumentSpecTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Patch the persisted document composition settings for this quote. Use this for theme, density, accent, section order, or section titling changes. Do not patch `/spec` directly; it is regenerated automatically from the document state.",
    inputSchema: z.object({
      ops: z.array(opSchema).min(1),
    }),
    execute: async ({ ops }): Promise<PatchDocumentSpecOutput> => {
      if (ops.some((op) => op.path === "/spec" || op.path.startsWith("/spec/"))) {
        return {
          ok: false,
          error:
            "Patch `/spec` is not allowed. Patch document settings or section definitions instead.",
        };
      }

      const [row] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!row) {
        return { ok: false, error: "Quote not found" };
      }

      const normalized = normalizeQuoteData(row.data as Partial<QuoteData>);
      const currentDocument = normalized.document;
      if (!currentDocument) {
        return { ok: false, error: "Document state is missing" };
      }

      let patchedDocument = currentDocument;
      try {
        const result = applyJsonPatch(
          structuredClone(currentDocument) as object,
          ops as Operation[],
          true,
          false,
        );
        patchedDocument = result.newDocument as typeof currentDocument;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: `Patch failed: ${message}` };
      }

      const nextDocument = buildQuoteDocumentState(normalized, patchedDocument);
      const issues = validateDocumentPatch(nextDocument);
      const next = {
        ...normalized,
        document: nextDocument,
      };

      await persistQuoteData({
        quote: {
          id: row.id,
          title: row.title,
          lang: row.lang,
        },
        data: next,
      });

      return {
        ok: true,
        touchedPaths: ops.map((op) => `/document${op.path}`),
        issues,
        summary: summarizeQuoteDocumentState(nextDocument),
      };
    },
  });
}
