import { describe, expect, test } from "bun:test";

import { buildQuoteFixture, buildNormalizedQuoteFixture } from "./document-plan-fixtures";
import { buildQuoteRenderSummary } from "./render-summary";

describe("buildQuoteRenderSummary", () => {
  test("reports live section visibility and pricing mismatches from rendered data", () => {
    const data = buildNormalizedQuoteFixture({
      documentPlan: {
        version: 1,
        locked: true,
        archetype: "project-proposal",
        preset: "essentielle",
        detailLevel: "medium",
        serviceLayoutPolicy: "itemized-without-price",
        serviceLayout: "itemized-without-price",
        commercialPreset: "custom",
        enabledSections: ["cover", "services", "terms"],
        sectionSelections: [
          { key: "cover", enabled: true, variant: "medium" },
          { key: "overview", enabled: true, variant: "medium" },
          { key: "services", enabled: true, variant: "medium" },
          { key: "about", enabled: false, variant: "medium" },
          { key: "culture", enabled: false, variant: "medium" },
          { key: "leadership", enabled: false, variant: "medium" },
          { key: "team", enabled: false, variant: "medium" },
          { key: "partners", enabled: false, variant: "medium" },
          { key: "commercial", enabled: false, variant: "medium" },
          { key: "terms", enabled: true, variant: "medium" },
        ],
        sections: [
          { key: "includeAboutUs", enabled: false, variant: "default" },
          { key: "includeCulture", enabled: false, variant: "default" },
          { key: "includeCeoMessage", enabled: false, variant: "default" },
          { key: "includeTeam", enabled: false, variant: "default" },
          { key: "includePartners", enabled: false, variant: "default" },
          { key: "includeTermsAndConditions", enabled: true, variant: "default" },
        ],
      },
      services: [
        {
          ...buildQuoteFixture().services[0],
          layout: "itemized-with-price",
        },
      ],
      documentContent: {
        version: 1,
        regions: {
          "service:0:before-table": {
            target: { scope: "service", index: 0, anchor: "before-table" },
            label: "service 1 before table",
            locationHints: ["above table"],
            blocks: [{ type: "paragraph", text: "Intro compacte" }],
          },
          "service:0:after-tax": {
            target: { scope: "service", index: 0, anchor: "after-tax" },
            label: "service 1 after tax",
            locationHints: ["below tax disclaimer"],
            blocks: [{ type: "paragraph", text: "Modalites de paiement : 100 %" }],
          },
        },
      },
    });

    const summary = buildQuoteRenderSummary(data, 6);

    expect(summary.pageCount).toBe(6);
    expect(summary.pricingLayoutPolicy).toBe("itemized-without-price");
    expect(summary.visibleSections.map((section) => section.key)).toEqual([
      "cover",
      "table_of_contents",
      "overview",
      "services",
      "terms",
    ]);
    expect(summary.hiddenSections).toContain("commercial");
    expect(summary.serviceLayouts).toEqual([
      {
        index: 0,
        name: "Controle d'acces",
        layout: "itemized-with-price",
      },
    ]);
    expect(summary.nonEmptyRegions).toEqual([
      {
        regionId: "service:0:before-table",
        blockCount: 1,
      },
      {
        regionId: "service:0:after-tax",
        blockCount: 1,
      },
    ]);
    expect(summary.consistencyWarnings).toEqual([
      "pricingLayoutPolicy=itemized-without-price but 1 service section(s) still render as itemized-with-price",
    ]);
  });
});
