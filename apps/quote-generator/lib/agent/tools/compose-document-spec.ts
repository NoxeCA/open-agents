import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import type { QuoteData } from "@/lib/quote/schema";

import {
  JSON_RENDER_DRAFT_KEY,
  JSON_RENDER_DRAFT_STORAGE_PATH,
  summarizeJsonRenderDraft,
  validateJsonRenderDraft,
} from "./document-spec-draft";

import type { ComposeDocumentSpecOutput } from "../tool-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function composeDocumentSpecTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Create or replace the Claude-style json-render document draft stored at `/jsonRenderDraft`. Use this when the quote needs a brand-new page structure, a major redesign, or the first full draft before localized patching.",
    inputSchema: z.object({
      draft: z
        .unknown()
        .describe(
          "Complete json-render envelope to persist at `/jsonRenderDraft`. Must be a full Document envelope with version, optional brand/variables/attachments, and document.children.",
        ),
    }),
    execute: async ({ draft }): Promise<ComposeDocumentSpecOutput> => {
      const [row] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!row) {
        return { ok: false, error: "Quote not found" };
      }

      const validation = validateJsonRenderDraft(draft);
      if (!validation.ok) {
        return { ok: false, error: `Draft validation failed: ${validation.error}` };
      }

      const summary = summarizeJsonRenderDraft(validation.draft);
      if (!summary) {
        return {
          ok: false,
          error: "Draft validation failed: unable to summarize `/jsonRenderDraft`.",
        };
      }

      const currentData = row.data as Partial<QuoteData> & Record<string, unknown>;
      const nextData = {
        ...currentData,
        jsonRender: {
          ...(isRecord(currentData.jsonRender) ? currentData.jsonRender : {}),
          version: 1 as const,
          spec: validation.draft,
        },
      };
      delete (nextData as Record<string, unknown>)[JSON_RENDER_DRAFT_KEY];

      await persistQuoteData({
        quote: {
          id: row.id,
          title: row.title,
          lang: row.lang,
        },
        data: nextData as Partial<QuoteData>,
      });

      return {
        ok: true,
        touchedPaths: [JSON_RENDER_DRAFT_STORAGE_PATH],
        summary,
        integrityIssues: validation.integrityIssues,
      };
    },
  });
}
