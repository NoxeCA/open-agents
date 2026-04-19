import { buildQuoteDocumentPlan } from "@/lib/quote/document/document-plan";
import type { QuoteData } from "@/lib/quote/schema";

type QuoteLang = "fr" | "en";

function readLang(value: unknown): QuoteLang {
  return typeof value === "string" && value.toLowerCase().startsWith("en")
    ? "en"
    : "fr";
}

function formatSectionLabel(sectionKey: string, lang: QuoteLang) {
  const labels: Record<string, { fr: string; en: string }> = {
    cover: { fr: "Couverture", en: "Cover" },
    overview: { fr: "Vue d'ensemble", en: "Overview" },
    services: { fr: "Services", en: "Services" },
    about: { fr: "À propos", en: "About" },
    culture: { fr: "Culture", en: "Culture" },
    leadership: { fr: "Mot de direction", en: "Leadership note" },
    team: { fr: "Équipe", en: "Team" },
    partners: { fr: "Partenaires", en: "Partners" },
    commercial: { fr: "Cadre commercial", en: "Commercial" },
    terms: { fr: "Conditions", en: "Terms" },
    table_of_contents: { fr: "Table des matières", en: "Table of contents" },
  };

  return labels[sectionKey]?.[lang] ?? sectionKey;
}

export type QuoteRenderSummary = {
  pageCount: number;
  visibleSections: Array<{
    key: string;
    label: string;
  }>;
  hiddenSections: string[];
  pricingLayoutPolicy:
    | "zero-ventilation"
    | "itemized-without-price"
    | "itemized-with-price";
  serviceLayouts: Array<{
    index: number;
    name: string;
    layout:
      | "zero-ventilation"
      | "itemized-without-price"
      | "itemized-with-price";
  }>;
  nonEmptyRegions: Array<{
    regionId: string;
    blockCount: number;
  }>;
  consistencyWarnings: string[];
};

export function buildQuoteRenderSummary(
  data: QuoteData,
  pageCount: number,
): QuoteRenderSummary {
  const lang = readLang(data.lang);
  const plan = buildQuoteDocumentPlan(data);
  const visibleSections = [
    {
      key: "cover",
      label: formatSectionLabel("cover", lang),
    },
    {
      key: "table_of_contents",
      label: formatSectionLabel("table_of_contents", lang),
    },
    ...plan.sectionSelections
      .filter((section) => section.enabled)
      .map((section) => ({
        key: section.key,
        label: formatSectionLabel(section.key, lang),
      })),
  ].filter(
    (section, index, sections) =>
      sections.findIndex((candidate) => candidate.key === section.key) === index,
  );

  const hiddenSections = plan.sectionSelections
    .filter((section) => !section.enabled)
    .map((section) => section.key);

  const serviceLayouts = (data.services ?? []).map((service, index) => ({
    index,
    name:
      typeof service.sectionName === "string" && service.sectionName.trim().length > 0
        ? service.sectionName.trim()
        : `Section ${index + 1}`,
    layout: service.layout,
  }));

  const nonEmptyRegions = Object.entries(data.documentContent?.regions ?? {})
    .map(([regionId, region]) => ({
      regionId,
      blockCount: Array.isArray(region.blocks) ? region.blocks.length : 0,
    }))
    .filter((region) => region.blockCount > 0);

  const consistencyWarnings: string[] = [];
  const mismatchedServiceLayouts = serviceLayouts.filter(
    (service) => service.layout !== plan.serviceLayoutPolicy,
  );

  if (mismatchedServiceLayouts.length > 0) {
    consistencyWarnings.push(
      `pricingLayoutPolicy=${plan.serviceLayoutPolicy} but ${mismatchedServiceLayouts.length} service section(s) still render as ${mismatchedServiceLayouts
        .map((service) => service.layout)
        .filter((layout, index, values) => values.indexOf(layout) === index)
        .join(", ")}`,
    );
  }

  return {
    pageCount,
    visibleSections,
    hiddenSections,
    pricingLayoutPolicy: plan.serviceLayoutPolicy,
    serviceLayouts,
    nonEmptyRegions,
    consistencyWarnings,
  };
}
