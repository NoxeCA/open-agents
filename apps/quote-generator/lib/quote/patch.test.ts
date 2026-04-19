import { describe, expect, test } from "bun:test";

import { normalizeQuoteData } from "./normalize";
import { applyPatch } from "./patch";
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
});
