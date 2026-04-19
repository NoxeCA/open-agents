import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import { applyPatch, validatePartial } from "@/lib/quote/patch";
import type { Operation } from "@/lib/quote/patch";
import type { QuoteData } from "@/lib/quote/schema";

import { resolveDocumentContentPatchPath } from "../document-content-regions";
import { buildRendererMap } from "../prompt-context";
import type { PatchQuoteOutput, PatchQuoteTouchedRegion } from "../tool-types";

function normalizePointer(path: string) {
  if (path === "/") {
    return path;
  }

  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function pathsOverlap(left: string, right: string) {
  const normalizedLeft = normalizePointer(left);
  const normalizedRight = normalizePointer(right);

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.startsWith(`${normalizedRight}/`) ||
    normalizedRight.startsWith(`${normalizedLeft}/`)
  );
}

function resolveTouchedRegions(
  data: Partial<QuoteData>,
  touchedPaths: string[],
): PatchQuoteTouchedRegion[] {
  const rendererMap = buildRendererMap(data);
  const output: PatchQuoteTouchedRegion[] = [];
  const seen = new Set<string>();

  for (const entry of rendererMap) {
    for (const region of entry.editableRegions) {
      const matchedPaths = touchedPaths.filter((path) =>
        region.patchPaths.some((patchPath) => pathsOverlap(path, patchPath)),
      );

      if (matchedPaths.length === 0) {
        continue;
      }

      const key = [
        entry.pageStart,
        entry.pageEnd,
        entry.title,
        region.regionId,
        region.patchPaths.join("|"),
      ].join(":");

      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      output.push({
        regionId: region.regionId,
        pageTitle: entry.title,
        pageStart: entry.pageStart,
        pageEnd: entry.pageEnd,
        matchedPaths,
        patchPaths: region.patchPaths,
      });
    }
  }

  return output;
}

const opSchema = z.object({
  op: z.enum(["add", "replace", "remove", "move", "copy", "test"]),
  path: z
    .string()
    .describe(
      "JSON pointer path into the QuoteData document. Prefer stable keyed document region paths for visual edits, e.g. `/documentContent/regions/service:0:after-tax/blocks`, `/documentContent/regions/service:0:after-table/blocks/-`, `/documentContent/regions/proposal:body/blocks`, or classic data paths like `/projectTitle`.",
    ),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

export function patchQuoteTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Apply RFC 6902 JSON-Patch operations to the current quote data. Use this for every concrete change: prices, contacts, layouts, and document-region edits. For page/location edits, prefer stable keyed region paths like `/documentContent/regions/service:0:after-tax/blocks` or `/documentContent/regions/service:0:after-table/blocks`. The tool resolves those keyed paths onto the current stored quote shape and returns `touchedRegions` so you can confirm which stable document region was edited.",
    inputSchema: z.object({
      ops: z
        .array(opSchema)
        .min(1)
        .describe(
          "A list of JSON-Patch operations to apply atomically. If inserting into a rich-content region and the array already exists, append with `/-`; if the region is missing, add the region path with an array containing the new block.",
        ),
    }),
    execute: async ({ ops }): Promise<PatchQuoteOutput> => {
      const [row] = await db
        .select()
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!row) {
        return { ok: false, error: "Quote not found" };
      }

      let next: Partial<QuoteData>;
      const normalizedCurrent = normalizeQuoteData(
        row.data as Partial<QuoteData>,
      );
      const resolvedPaths: string[] = [];
      try {
        const resolvedOps = ops.map((op) => ({
          ...op,
          path: resolveDocumentContentPatchPath(normalizedCurrent, op.path),
          ...(op.from
            ? {
                from: resolveDocumentContentPatchPath(
                  normalizedCurrent,
                  op.from,
                ),
              }
            : {}),
        }));
        resolvedPaths.push(...resolvedOps.map((op) => op.path));

        next = applyPatch(
          normalizedCurrent,
          resolvedOps as Operation[],
        );
        next = normalizeQuoteData(next);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: `Patch failed: ${message}` };
      }

      const { issues } = validatePartial(next);

      await persistQuoteData({
        quote: {
          id: row.id,
          title: row.title,
          lang: row.lang,
        },
        data: next,
      });

      const touchedPaths = ops.map((op) => op.path);

      return {
        ok: true,
        touchedPaths,
        resolvedPaths,
        touchedRegions: resolveTouchedRegions(next, touchedPaths),
        issues,
      };
    },
  });
}
