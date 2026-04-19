import { describe, expect, test } from "bun:test";

import { buildQuoteFixture } from "./document-plan-fixtures";
import { assessQuoteProductionReadiness } from "./render-readiness";

describe("assessQuoteProductionReadiness", () => {
  test("blocks placeholder text that would otherwise pass schema validation", () => {
    const readiness = assessQuoteProductionReadiness(
      buildQuoteFixture({
        contactInfo: {
          name: "Marc-Olivier Gagner",
          company: "Noxe",
          phone: "A confirmer",
          email: "m.gagner@noxe.ca",
        },
      }),
    );

    expect(readiness.renderReadiness).toBe("blocked");
    expect(readiness.blockers).toContain("contactInfo.phone");
    expect(
      readiness.blockingIssues.some((issue) =>
        issue.includes("contactInfo.phone"),
      ),
    ).toBe(true);
  });

  test("blocks empty project summary description even though the schema allows it", () => {
    const readiness = assessQuoteProductionReadiness(
      buildQuoteFixture({
        projectSummary: {
          description: "",
          subtotal: 1600,
          totalProjectCost: 1600,
        },
      }),
    );

    expect(readiness.renderReadiness).toBe("blocked");
    expect(readiness.blockers).toContain("projectSummary.description");
  });

  test("blocks quotes missing exclusions and payment terms", () => {
    const readiness = assessQuoteProductionReadiness(
      buildQuoteFixture({
        exclusions: [],
        paymentTerms: [],
      }),
    );

    expect(readiness.renderReadiness).toBe("blocked");
    expect(readiness.blockers).toContain("exclusions");
    expect(readiness.blockers).toContain("paymentTerms");
  });

  test("does not block BOM OEM display fallbacks", () => {
    const readiness = assessQuoteProductionReadiness(
      buildQuoteFixture({
        services: [
          {
            ...buildQuoteFixture().services[0],
            bomItems: [
              {
                ...buildQuoteFixture().services[0].bomItems![0],
                oem: "—",
              },
            ],
          },
        ],
      }),
    );

    expect(readiness.blockers).not.toContain("services.0.bomItems.0.oem");
  });

  test("returns ready for a complete production-safe quote", () => {
    const readiness = assessQuoteProductionReadiness(buildQuoteFixture());

    expect(readiness.renderReadiness).toBe("ready");
    expect(readiness.blockers).toHaveLength(0);
    expect(readiness.blockingIssues).toHaveLength(0);
    expect(readiness.parsedData).toBeDefined();
  });
});
