import { describe, expect, test } from "bun:test";

import {
  buildQuoteDocumentComposition,
  buildQuoteDocumentPlan,
} from "./document-plan";
import { normalizeQuoteData } from "./normalize";
import { quoteCompositionSchema } from "./schema";
import type { QuoteData } from "./schema";

function buildLegacyQuote(overrides: Partial<QuoteData> = {}) {
  return {
    lang: "fr",
    documentType: "PROPOSITION",
    documentTitle: "Projet controle d'acces",
    clientName: "Ecole secondaire Prevost",
    services: [
      {
        sectionNumber: 1,
        sectionName: "Controle d'acces",
        description: "Fourniture du materiel principal",
        layout: "itemized-without-price" as const,
      },
    ],
    paymentTerms: [
      "35% a la signature",
      "15% a la commande du materiel",
      "40% en cours d'installation",
      "10% a la fin des travaux",
    ],
    includeAboutUs: false,
    includeCulture: false,
    includeCeoMessage: false,
    includeTeam: false,
    includePartners: false,
    includeTermsAndConditions: true,
    ...overrides,
  } as Partial<QuoteData>;
}

describe("quote document plan normalization", () => {
  test("synthesizes a compact plan from legacy flags and service layouts", () => {
    const normalized = normalizeQuoteData(
      buildLegacyQuote({
        includeAboutUs: true,
        includeCeoMessage: true,
        includePartners: true,
      }),
    );

    expect(normalized.document).toBeDefined();
    expect(normalized.composition).toBeDefined();
    expect(normalized.documentPlan).toBeDefined();
    expect(normalized.documentPlan?.archetype).toBe("project-proposal");
    expect(normalized.documentPlan?.preset).toBe("confiance");
    expect(normalized.documentPlan?.serviceLayoutPolicy).toBe(
      "itemized-without-price",
    );
    expect(normalized.documentPlan?.commercialPreset).toBe(
      "signature-progress",
    );
    expect(normalized.composition).toEqual(
      buildQuoteDocumentComposition(normalized.documentPlan!),
    );
    expect(normalized.includeAboutUs).toBe(true);
    expect(normalized.includeCeoMessage).toBe(true);
    expect(normalized.includePartners).toBe(true);
    expect(normalized.includeTermsAndConditions).toBe(true);
  });

  test("preserves an explicit plan and syncs the legacy booleans back to it", () => {
    const seed = buildQuoteDocumentPlan(
      buildLegacyQuote({
        includeCulture: true,
        includeTeam: true,
        includeTermsAndConditions: true,
      }),
    );

    const normalized = normalizeQuoteData(
      buildLegacyQuote({
        composition: seed,
        documentPlan: seed,
        includeAboutUs: false,
        includeCulture: false,
        includeCeoMessage: false,
        includeTeam: false,
        includePartners: false,
        includeTermsAndConditions: true,
      }),
    );

    expect(normalized.documentPlan).toEqual(seed);
    expect(normalized.composition).toEqual(buildQuoteDocumentComposition(seed));
    expect(normalized.includeAboutUs).toBe(false);
    expect(normalized.includeCulture).toBe(true);
    expect(normalized.includeTeam).toBe(true);
    expect(normalized.includePartners).toBe(false);
    expect(normalized.includeTermsAndConditions).toBe(true);
  });

  test("accepts partial documentPlan payloads", () => {
    const parsed = quoteCompositionSchema.safeParse({
      detailLevel: "small",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data.detailLevel).toBe("small");
    expect(parsed.data.archetype).toBe("project-proposal");
    expect(parsed.data.locked).toBe(true);
  });
});
