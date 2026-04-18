import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { applyPatch, validatePartial } from "@/lib/quote/patch";
import type { Operation } from "@/lib/quote/patch";

import type { PatchQuoteOutput } from "../tool-types";

const opSchema = z.object({
  op: z.enum(["add", "replace", "remove", "move", "copy", "test"]),
  path: z
    .string()
    .describe(
      "JSON pointer path into the QuoteData document, e.g. `/projectTitle` or `/services/0/unitPrice`.",
    ),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

export function patchQuoteTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Apply RFC 6902 JSON-Patch operations to the current quote data. Use this for every concrete change (part, price, contact info, layout, etc.). Returns any validation issues so you can correct them in a follow-up call.",
    inputSchema: z.object({
      ops: z
        .array(opSchema)
        .min(1)
        .describe("A list of JSON-Patch operations to apply atomically."),
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

      let next: unknown;
      try {
        next = applyPatch(row.data as unknown, ops as Operation[]);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: `Patch failed: ${message}` };
      }

      const { issues } = validatePartial(next);

      await db
        .update(quotes)
        .set({ data: next, updatedAt: new Date() })
        .where(eq(quotes.id, quoteId));

      return {
        ok: true,
        touchedPaths: ops.map((o) => o.path),
        issues,
      };
    },
  });
}
