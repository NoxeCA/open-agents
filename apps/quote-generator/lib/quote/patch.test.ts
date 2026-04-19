import { describe, expect, test } from "bun:test";

import { normalizeQuoteData } from "./normalize";
import { applyPatch, validatePartial } from "./patch";
import type { QuoteData } from "./schema";

describe("quote patch compatibility", () => {
  test("coerces replace to add when a top-level field is missing", () => {
    const current = normalizeQuoteData({
      lang: "fr",
      notes: [],
      services: [],
      exclusions: [],
      paymentTerms: [],
      specialConditions: [],
    } as Partial<QuoteData>);

    const next = applyPatch(current, [
      {
        op: "replace",
        path: "/preparedFor",
        value: [{ name: "A confirmer", company: "Client" }],
      },
    ]);

    expect(next.preparedFor).toEqual([{ name: "A confirmer", company: "Client" }]);
  });

  test("keeps replace semantics when the target path already exists", () => {
    const current = normalizeQuoteData({
      lang: "fr",
      notes: ["Old note"],
      services: [],
      exclusions: [],
      paymentTerms: [],
      specialConditions: [],
    } as Partial<QuoteData>);

    const next = applyPatch(current, [
      {
        op: "replace",
        path: "/notes",
        value: ["New note"],
      },
    ]);

    expect(next.notes).toEqual(["New note"]);
  });

  test("normalization seeds missing common quote fields and sanitizes placeholders", () => {
    const normalized = normalizeQuoteData({
      lang: "fr-CA" as unknown as QuoteData["lang"],
      clientName: "false",
      proposal: {
        addressee: {
          name: "false",
          company: "false",
          address: "",
        },
      } as Partial<QuoteData["proposal"]>,
    } as Partial<QuoteData>);

    expect(normalized.lang).toBe("fr");
    expect(normalized.clientName).toBe("");
    expect(normalized.preparedFor).toEqual([]);
    expect(normalized.preparedBy).toEqual([]);
    expect(normalized.revision).toBe(1);
    expect(normalized.documentType).toBe("PROPOSITION");
    expect(normalized.proposal?.addressee?.name).toBe("");
    expect(normalized.proposal?.addressee?.company).toBe("");
  });

  test("validation does not throw on normalized quotes with refinements", () => {
    const normalized = normalizeQuoteData({
      lang: "fr",
      services: [],
      exclusions: [],
      paymentTerms: [],
      specialConditions: [],
    } as Partial<QuoteData>);

    expect(() => validatePartial(normalized)).not.toThrow();
  });

  test("commercial document regions support rich blocks before payment terms", () => {
    const current = normalizeQuoteData({
      lang: "fr",
      services: [],
      exclusions: [],
      paymentTerms: [],
      specialConditions: [],
      notes: [],
    } as Partial<QuoteData>);

    const next = applyPatch(current, [
      {
        op: "add",
        path: "/documentContent/regions/commercial:before-payment-terms/blocks/-",
        value: {
          type: "divider",
        },
      },
      {
        op: "add",
        path: "/documentContent/regions/commercial:before-payment-terms/blocks/-",
        value: {
          type: "table",
          title: "Calendrier",
          columns: [{ label: "Etape" }, { label: "Pourcentage" }],
          rows: [
            ["Signature", "35 %"],
            ["Livraison", "65 %"],
          ],
        },
      },
    ]);

    expect(
      next.documentContent?.regions["commercial:before-payment-terms"]?.blocks,
    ).toEqual([
      { type: "divider" },
      {
        type: "table",
        title: "Calendrier",
        columns: [{ label: "Etape" }, { label: "Pourcentage" }],
        rows: [
          ["Signature", "35 %"],
          ["Livraison", "65 %"],
        ],
      },
    ]);
  });

  test("removing one service section via /services/<index> works cleanly", () => {
    const current = normalizeQuoteData({
      lang: "fr",
      services: [
        {
          sectionNumber: 1,
          sectionName: "Acces",
          description: "Controle d'acces",
          bomItems: [],
          bomSubtotal: 0,
          laborCategories: [],
          laborSubtotal: 0,
          totalCost: 1000,
          layout: "itemized-with-price",
        },
        {
          sectionNumber: 2,
          sectionName: "Intrusion",
          description: "Detection intrusion",
          bomItems: [],
          bomSubtotal: 0,
          laborCategories: [],
          laborSubtotal: 0,
          totalCost: 500,
          layout: "itemized-with-price",
        },
      ],
      exclusions: [],
      paymentTerms: [],
      specialConditions: [],
      notes: [],
    } as Partial<QuoteData>);

    const next = applyPatch(current, [
      {
        op: "remove",
        path: "/services/0",
      },
    ]);

    expect(next.services).toHaveLength(1);
    expect(next.services?.[0]?.sectionName).toBe("Intrusion");
  });
});
