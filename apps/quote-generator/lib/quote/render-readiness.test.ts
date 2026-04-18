import { describe, expect, test } from "bun:test";

import { assessQuoteProductionReadiness } from "./render-readiness";
import type { QuoteData } from "./schema";

function buildValidQuote(overrides: Partial<QuoteData> = {}): QuoteData {
  return {
    lang: "fr",
    clientName: "Ecole secondaire Prevost",
    subtitle: "Soumission commerciale",
    documentType: "PROPOSITION",
    documentTitle: "Projet controle d'acces",
    quoteID: "GGXX-LFC",
    revision: 1,
    quoteDate: "2026-04-18",
    validUntil: "2026-05-18",
    preparedFor: [{ name: "Jean Client" }],
    preparedBy: [{ name: "Marc-Olivier Gagner" }],
    includeAboutUs: false,
    includeCulture: false,
    includeCeoMessage: false,
    includeTeam: false,
    includePartners: false,
    proposal: {
      date: "2026-04-18",
      addressee: {
        name: "Jean Client",
        company: "Ecole secondaire Prevost",
        address: "225 ch. de la Montagne, Prevost, QC",
      },
      object: "Soumission controle d'acces",
      paragraphs: ["Merci de votre confiance."],
    },
    projectTitle: "LC Connect - GGXX-LFC",
    projectIntro:
      "Noxe presente cette proposition pour la fourniture et l'installation du systeme.",
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
        layout: "itemized-with-price",
      },
    ],
    projectSummary: {
      description: "Fourniture, installation et mise en service complete.",
      subtotal: 1600,
      totalProjectCost: 1600,
    },
    exclusions: ["La quincaillerie electrifiee fournie par d'autres est exclue."],
    specialConditions: [],
    notes: [],
    paymentTerms: [
      "35 % a la signature",
      "15 % a la commande du materiel",
      "40 % en cours d'installation",
      "10 % a la fin des travaux",
    ],
    contactInfo: {
      name: "Marc-Olivier Gagner",
      company: "Noxe",
      phone: "438-865-8020",
      email: "m.gagner@noxe.ca",
    },
    includeTermsAndConditions: true,
    ...overrides,
  };
}

describe("assessQuoteProductionReadiness", () => {
  test("blocks placeholder text that would otherwise pass schema validation", () => {
    const readiness = assessQuoteProductionReadiness(
      buildValidQuote({
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
      buildValidQuote({
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
      buildValidQuote({
        exclusions: [],
        paymentTerms: [],
      }),
    );

    expect(readiness.renderReadiness).toBe("blocked");
    expect(readiness.blockers).toContain("exclusions");
    expect(readiness.blockers).toContain("paymentTerms");
  });

  test("returns ready for a complete production-safe quote", () => {
    const readiness = assessQuoteProductionReadiness(buildValidQuote());

    expect(readiness.renderReadiness).toBe("ready");
    expect(readiness.blockers).toHaveLength(0);
    expect(readiness.blockingIssues).toHaveLength(0);
    expect(readiness.parsedData).toBeDefined();
  });
});
