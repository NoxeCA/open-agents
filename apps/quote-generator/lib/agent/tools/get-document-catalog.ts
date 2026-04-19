import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import {
  buildManifest,
  buildPrompt,
} from "@/lib/json-render/catalog/prompt";

import {
  JSON_RENDER_DRAFT_STORAGE_PATH,
  readJsonRenderDraft,
  summarizeJsonRenderDraft,
} from "./document-spec-draft";

import type { DocumentCatalogOutput } from "../tool-types";

const JSON_RENDER_ASSET_KEYS = [
  "logoDark",
  "hexPatternTopRight",
  "hexPatternBottomRight",
  "arrowsFooter",
  "noxeXLogoDark",
  "arrowDark",
  "arrowGray",
  "arrowLightGray",
  "infoIcon",
] as const;

export function getDocumentCatalogTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Return the Claude-style json-render catalog prompt, component manifest, and allowed image asset keys for the quote document draft stored at `/jsonRenderDraft`. Use this draft surface for custom appendix-style composition and image-rich insertions, not as the primary control plane for hiding the standard live quote sections.",
    inputSchema: z.object({}),
    execute: async (): Promise<DocumentCatalogOutput> => {
      const [row] = await db
        .select({ data: quotes.data })
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      const currentDraft = readJsonRenderDraft(row?.data);

      return {
        storagePath: JSON_RENDER_DRAFT_STORAGE_PATH,
        assetKeys: [...JSON_RENDER_ASSET_KEYS],
        catalogPrompt: buildPrompt({
          customRules: [
            "Persist the full envelope at `/jsonRenderDraft`.",
            "When patching this draft, JSON Patch paths are relative to the envelope root such as `/document/children/0`, `/document/children/-`, or `/attachments/-`.",
            "Prefer the crafted Noxe composite components as the primary building blocks for standard quote sections. Use raw paragraph/table/divider/image nodes mostly for inserted content, local embellishments, or appendix-style pages.",
            "For page-level edits, prefer modifying existing `Page` or `ServiceSection` nodes instead of pushing quote prose into rigid legacy fields.",
            "Uploaded quote images or plans can be referenced with `quote-file:<fileId>` in `Image.src`; the render pipeline resolves those into embedded data URIs automatically.",
            "For new appendix-style material, prefer adding a dedicated `Page` with freeform nodes rather than forcing everything into the commercial summary pages.",
            "For the live handcrafted Noxe PDF, hide or show standard sections through `patch_quote` on `/documentPlan/sectionVisibility/*` or remove a single extracted service via `/services/<index>`. Do not treat the draft tree as the source of truth for hiding standard legacy sections.",
          ],
        }),
        manifest: buildManifest(),
        currentDraftSummary: currentDraft
          ? summarizeJsonRenderDraft(currentDraft)
          : null,
      };
    },
  });
}
