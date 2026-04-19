import { describe, expect, test } from "bun:test";

import { buildQuoteFixture } from "./document-plan-fixtures";
import { normalizeQuoteData } from "./normalize";

describe("quote document plan readiness", () => {
  test("derives a locked default composition/documentPlan from a valid quote", () => {
    const normalized = normalizeQuoteData(buildQuoteFixture());

    expect(normalized.composition).toEqual(normalized.documentPlan);
    expect(normalized.documentPlan).toMatchObject({
      version: 1,
      archetype: "project-proposal",
      preset: "essentielle",
      detailLevel: "medium",
      serviceLayoutPolicy: "itemized-with-price",
      commercialPreset: "signature-progress",
    });
    expect(normalized.documentPlan?.sectionSelections).toEqual([
      { key: "cover", enabled: true, variant: "medium" },
      { key: "overview", enabled: true, variant: "medium" },
      { key: "services", enabled: true, variant: "medium" },
      { key: "about", enabled: false, variant: "medium" },
      { key: "culture", enabled: false, variant: "medium" },
      { key: "leadership", enabled: false, variant: "medium" },
      { key: "team", enabled: false, variant: "medium" },
      { key: "partners", enabled: false, variant: "medium" },
      { key: "commercial", enabled: true, variant: "medium" },
      { key: "terms", enabled: true, variant: "medium" },
    ]);
  });

  test("legacy include* booleans still produce a stable optional-section selection model", () => {
    const normalized = normalizeQuoteData(
      buildQuoteFixture({
        includeAboutUs: true,
        includeCulture: true,
        includeCeoMessage: false,
        includeTeam: true,
        includePartners: false,
        includeTermsAndConditions: false,
      }),
    );

    expect(normalized.documentPlan?.sectionSelections).toEqual([
      { key: "cover", enabled: true, variant: "medium" },
      { key: "overview", enabled: true, variant: "medium" },
      { key: "services", enabled: true, variant: "medium" },
      { key: "about", enabled: true, variant: "medium" },
      { key: "culture", enabled: true, variant: "medium" },
      { key: "leadership", enabled: false, variant: "medium" },
      { key: "team", enabled: true, variant: "medium" },
      { key: "partners", enabled: false, variant: "medium" },
      { key: "commercial", enabled: true, variant: "medium" },
      { key: "terms", enabled: false, variant: "medium" },
    ]);
  });

  test("service layout and commercial preset inference stay deterministic", () => {
    const normalized = normalizeQuoteData(
      buildQuoteFixture({
        projectSummary: {
          description: "Fourniture et installation complete.",
          subtotal: 1600,
          totalProjectCost: 1600,
        },
        paymentTerms: ["35%", "15%", "40%", "10%"],
        services: [
          {
            sectionNumber: 1,
            sectionName: "Controle d'acces",
            description: "Fourniture du materiel principal",
            bomItems: [
              {
                qty: 1,
                partNumber: "AQD1",
                description: "Controleur principal",
                oem: "HID",
                unitPrice: 1200,
                total: 1200,
              },
            ],
            bomSubtotal: 1200,
            laborCategories: [{ category: "Installation", amount: 400 }],
            laborSubtotal: 400,
            totalCost: 1600,
            layout: "itemized-without-price",
          },
        ],
      }),
    );

    expect(normalized.documentPlan).toMatchObject({
      archetype: "project-proposal",
      preset: "essentielle",
      detailLevel: "medium",
      serviceLayoutPolicy: "itemized-without-price",
      commercialPreset: "signature-progress",
    });
  });
});
