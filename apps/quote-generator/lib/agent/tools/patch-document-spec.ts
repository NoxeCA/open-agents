import { tool } from "ai";
import { applyPatch as applyJsonPatch } from "fast-json-patch";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import type { QuoteData } from "@/lib/quote/schema";

import {
  JSON_RENDER_DRAFT_KEY,
  JSON_RENDER_DRAFT_STORAGE_PATH,
  readJsonRenderDraft,
  summarizeJsonRenderDraft,
  validateJsonRenderDraft,
} from "./document-spec-draft";

import type {
  Operation,
  PatchDocumentSpecOutput,
} from "../tool-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const opSchema = z.object({
  op: z.enum(["add", "replace", "remove", "move", "copy", "test"]),
  path: z
    .string()
    .describe(
      "JSON pointer path inside the stored `/jsonRenderDraft` envelope, for example `/document/children/0`, `/document/children/0/children/-`, `/document/children/-`, or `/attachments/-`.",
    ),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

function formatTouchedPath(path: string) {
  return path.length > 0 && path !== "/"
    ? `${JSON_RENDER_DRAFT_STORAGE_PATH}${path}`
    : JSON_RENDER_DRAFT_STORAGE_PATH;
}

export function patchDocumentSpecTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Apply RFC 6902 JSON-Patch operations to the Claude-style json-render draft stored at `/jsonRenderDraft`. Use this for targeted appendix, image, and draft-layout exploration after the draft already exists. Do not use this as the primary way to hide standard live quote sections like overview, services, commercial, or terms; those must go through `patch_quote` on the stable `/documentPlan/sectionVisibility/*` paths or `/services/<index>`.",
    inputSchema: z.object({
      ops: z
        .array(opSchema)
        .min(1)
        .describe(
          "Patch operations relative to the `/jsonRenderDraft` root. Use `compose_document_spec` first if no draft exists yet.",
        ),
    }),
    execute: async ({ ops }): Promise<PatchDocumentSpecOutput> => {
      const [row] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!row) {
        return { ok: false, error: "Quote not found" };
      }

      const currentData = row.data as Partial<QuoteData> & Record<string, unknown>;
      const currentDraft = readJsonRenderDraft(currentData);
      if (!currentDraft) {
        return {
          ok: false,
          error:
            "No `/jsonRenderDraft` exists yet. Call `compose_document_spec` with a full envelope before patching.",
        };
      }

      let patchedDraft: unknown;
      try {
        patchedDraft = applyJsonPatch(
          structuredClone(currentDraft) as object,
          ops as Operation[],
          true,
          false,
        ).newDocument;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, error: `Patch failed: ${message}` };
      }

      const validation = validateJsonRenderDraft(patchedDraft);
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
        touchedPaths: ops.map((op) => formatTouchedPath(op.path)),
        summary,
        integrityIssues: validation.integrityIssues,
      };
    },
  });
}
