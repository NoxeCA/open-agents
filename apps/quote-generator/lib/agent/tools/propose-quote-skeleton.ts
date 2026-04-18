import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { downloadBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { quoteFiles, quotes } from "@/lib/db/schema";
import { proposeSkeleton } from "@/lib/excel/heuristics";
import { parseWorkbook } from "@/lib/excel/parse";

import type { ProposeQuoteSkeletonOutput } from "../tool-types";

function collectTopLevelKeys(obj: unknown): string[] {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return [];
  }
  return Object.keys(obj as Record<string, unknown>);
}

function shallowMergeNonNull(
  base: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(incoming)) {
    if (v !== null && v !== undefined) {
      next[k] = v;
    }
  }
  return next;
}

export function proposeQuoteSkeletonTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "After `parse_excel`, infer a starter QuoteData skeleton from the workbook and merge it into the current quote. Returns which top-level keys were populated and which still need confirmation.",
    inputSchema: z.object({
      fileId: z
        .string()
        .describe("The fileId previously passed to `parse_excel`."),
    }),
    execute: async ({ fileId }): Promise<ProposeQuoteSkeletonOutput> => {
      const [file] = await db
        .select()
        .from(quoteFiles)
        .where(
          and(
            eq(quoteFiles.id, fileId),
            eq(quoteFiles.quoteId, quoteId),
            eq(quoteFiles.kind, "excel"),
          ),
        )
        .limit(1);

      if (!file) {
        return { ok: false, error: "File not found for this quote" };
      }

      const [quote] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!quote) {
        return { ok: false, error: "Quote not found" };
      }

      let skeletonResult: Awaited<ReturnType<typeof proposeSkeleton>>;
      try {
        const buf = await downloadBlob(file.blobUrl);
        const wb = await parseWorkbook(buf);
        skeletonResult = await proposeSkeleton(wb);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {
          ok: false,
          error: `Failed to analyse workbook: ${message}`,
        };
      }

      const existing = (quote.data ?? {}) as Record<string, unknown>;
      const skeleton = (skeletonResult?.skeleton ?? {}) as Record<
        string,
        unknown
      >;
      const merged = shallowMergeNonNull(existing, skeleton);

      await db
        .update(quotes)
        .set({ data: merged, updatedAt: new Date() })
        .where(eq(quotes.id, quoteId));

      const proposedKeys = collectTopLevelKeys(skeleton);
      const needsConfirmation: string[] = Array.isArray(
        skeletonResult?.needsConfirmation,
      )
        ? skeletonResult.needsConfirmation
        : [];
      const stats = {
        sheetsConsidered: skeletonResult?.stats?.sheetsConsidered ?? 0,
        partsDetected: skeletonResult?.stats?.partsDetected ?? 0,
        servicesDetected: skeletonResult?.stats?.servicesDetected ?? 0,
      };

      return {
        ok: true,
        proposedKeys,
        needsConfirmation,
        stats,
      };
    },
  });
}
