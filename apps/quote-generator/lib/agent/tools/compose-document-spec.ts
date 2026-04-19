import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import {
  buildQuoteDocumentState,
  summarizeQuoteDocumentState,
} from "@/lib/quote/document/builder";
import {
  quoteDocumentAccentSchema,
  quoteDocumentDensitySchema,
  quoteDocumentSectionCatalog,
  quoteDocumentSectionKindSchema,
  quoteDocumentThemeSchema,
} from "@/lib/quote/document/catalog";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import type { QuoteData } from "@/lib/quote/schema";

import type { ComposeDocumentSpecOutput } from "../tool-types";

function reorderSections(
  currentSections: NonNullable<Partial<QuoteData>["document"]>["sections"],
  desiredOrder: z.infer<typeof quoteDocumentSectionKindSchema>[] | undefined,
) {
  if (!desiredOrder || desiredOrder.length === 0) {
    return currentSections;
  }

  const byKind = new Map(currentSections.map((section) => [section.kind, section]));
  const output = desiredOrder
    .map((kind) => byKind.get(kind))
    .filter((section): section is NonNullable<typeof section> => Boolean(section));

  for (const section of currentSections) {
    if (!output.some((item) => item.kind === section.kind)) {
      output.push(section);
    }
  }

  return output;
}

export function composeDocumentSpecTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Recompose the persisted quote document using the catalog presets. Use this to change the theme, density, accent, section order, or which optional sections appear in the proposal preview and final PDF.",
    inputSchema: z.object({
      theme: quoteDocumentThemeSchema.optional(),
      density: quoteDocumentDensitySchema.optional(),
      accent: quoteDocumentAccentSchema.optional(),
      sectionOrder: z.array(quoteDocumentSectionKindSchema).optional(),
      includeSections: z.array(quoteDocumentSectionKindSchema).optional(),
      excludeSections: z.array(quoteDocumentSectionKindSchema).optional(),
    }),
    execute: async ({
      accent,
      density,
      excludeSections,
      includeSections,
      sectionOrder,
      theme,
    }): Promise<ComposeDocumentSpecOutput> => {
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

      const allowedSectionKinds = new Set(
        quoteDocumentSectionCatalog.map((section) => section.kind),
      );
      const includeSet = new Set(
        (includeSections ?? []).filter((kind) => allowedSectionKinds.has(kind)),
      );
      const excludeSet = new Set(
        (excludeSections ?? []).filter((kind) => allowedSectionKinds.has(kind)),
      );

      let nextSections = currentDocument.sections.filter(
        (section) => !excludeSet.has(section.kind),
      );

      for (const kind of includeSet) {
        if (nextSections.some((section) => section.kind === kind)) continue;
        nextSections.push({
          id: kind,
          kind,
          enabled: true,
          variant: "default",
        });
      }

      nextSections = reorderSections(nextSections, sectionOrder);

      const nextDocument = buildQuoteDocumentState(normalized, {
        ...currentDocument,
        theme: theme ?? currentDocument.theme,
        density: density ?? currentDocument.density,
        accent: accent ?? currentDocument.accent,
        sections: nextSections,
      });

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
        summary: summarizeQuoteDocumentState(nextDocument),
        touchedPaths: [
          ...(theme ? ["/document/theme"] : []),
          ...(density ? ["/document/density"] : []),
          ...(accent ? ["/document/accent"] : []),
          ...(sectionOrder ? ["/document/sections"] : []),
          ...(includeSections && includeSections.length > 0
            ? ["/document/sections"]
            : []),
          ...(excludeSections && excludeSections.length > 0
            ? ["/document/sections"]
            : []),
          "/document/spec",
        ],
      };
    },
  });
}
