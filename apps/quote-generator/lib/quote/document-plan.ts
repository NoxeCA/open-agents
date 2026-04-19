import { z } from "zod";

import {
  buildQuoteDocumentComposition as buildCanonicalQuoteDocumentComposition,
  buildQuoteDocumentPlan as buildCanonicalQuoteDocumentPlan,
  getDocumentPlanSectionForLegacyFlag as getCanonicalDocumentPlanSectionForLegacyFlag,
  getLegacyFlagForDocumentPlanSection as getCanonicalLegacyFlagForDocumentPlanSection,
  isQuoteDocumentPlanSectionEnabled as isCanonicalQuoteDocumentPlanSectionEnabled,
  syncLegacySectionFlagsFromDocumentPlan as syncCanonicalLegacySectionFlagsFromDocumentPlan,
  syncQuoteDocumentPlan as syncCanonicalQuoteDocumentPlan,
} from "./document/document-plan";
import {
  quoteDocumentPlanArchetypeSchema,
  quoteDocumentPlanCommercialPresetSchema,
  quoteDocumentPlanDetailLevelSchema,
  quoteDocumentPlanPresetSchema,
  quoteDocumentPlanSectionKeySchema,
  quoteDocumentPlanSectionSelectionSchema,
  quoteDocumentPlanServiceLayoutSchema,
  type QuoteDocumentPlanSectionSelection,
  type QuoteDocumentPlanSectionKey,
  type QuoteDocumentPlanServiceLayout,
} from "./document/catalog";

const RECIPE_SECTION_KEY_VALUES = [
  "includeAboutUs",
  "includeCulture",
  "includeCeoMessage",
  "includeTeam",
  "includePartners",
  "includeTermsAndConditions",
] as const;

const RECIPE_SECTION_VARIANT_VALUES = [
  "default",
  "immersive",
  "compact",
  "grid",
] as const;

export const quoteDocumentPlanSectionVariantSchema = z.enum(
  RECIPE_SECTION_VARIANT_VALUES,
);

export const quoteDocumentPlanRecipeSectionSchema = z.object({
  key: z.enum(RECIPE_SECTION_KEY_VALUES),
  enabled: z.boolean().default(true),
  variant: quoteDocumentPlanSectionVariantSchema.default("default"),
});

export type QuoteDocumentPlanSectionVariant = z.infer<
  typeof quoteDocumentPlanSectionVariantSchema
>;

export type QuoteDocumentPlanRecipeSection = z.infer<
  typeof quoteDocumentPlanRecipeSectionSchema
>;

export const quoteDocumentPlanSchema = z
  .object({
    version: z.literal(1).default(1),
    locked: z.literal(true).default(true),
    archetype: quoteDocumentPlanArchetypeSchema.default("project-proposal"),
    preset: quoteDocumentPlanPresetSchema.default("essentielle"),
    detailLevel: quoteDocumentPlanDetailLevelSchema.default("medium"),
    serviceLayoutPolicy: quoteDocumentPlanServiceLayoutSchema.default(
      "itemized-with-price",
    ),
    commercialPreset: quoteDocumentPlanCommercialPresetSchema.default("custom"),
    sections: z.array(quoteDocumentPlanRecipeSectionSchema).default([]),
    sectionSelections: z.array(quoteDocumentPlanSectionSelectionSchema).default(
      [],
    ),
    enabledSections: z.array(quoteDocumentPlanSectionKeySchema).default([]),
    serviceLayout: quoteDocumentPlanServiceLayoutSchema.default(
      "itemized-with-price",
    ),
  })
  .passthrough();

export type QuoteDocumentPlan = z.infer<typeof quoteDocumentPlanSchema> & {
  locked: true;
  sections: QuoteDocumentPlanRecipeSection[];
  sectionSelections: QuoteDocumentPlanSectionSelection[];
  enabledSections: QuoteDocumentPlanSectionKey[];
  serviceLayout: QuoteDocumentPlanServiceLayout;
};

export {
  quoteDocumentPlanArchetypeSchema,
  quoteDocumentPlanCommercialPresetSchema,
  quoteDocumentPlanDetailLevelSchema,
  quoteDocumentPlanPresetSchema,
  quoteDocumentPlanSectionKeySchema,
  quoteDocumentPlanSectionSelectionSchema,
  quoteDocumentPlanServiceLayoutSchema,
  type QuoteDocumentPlanArchetype,
  type QuoteDocumentPlanCommercialPreset,
  type QuoteDocumentPlanDetailLevel,
  type QuoteDocumentPlanPreset,
  type QuoteDocumentPlanSectionKey,
  type QuoteDocumentPlanSectionSelection,
  type QuoteDocumentPlanServiceLayout,
} from "./document/catalog";

export function buildQuoteDocumentPlan(
  data: Record<string, unknown> | null | undefined,
  seed?: Partial<QuoteDocumentPlan> | null | undefined,
): QuoteDocumentPlan {
  return buildCanonicalQuoteDocumentPlan(data, seed) as QuoteDocumentPlan;
}

export function syncQuoteDocumentPlan(
  data: Record<string, unknown> | null | undefined,
): QuoteDocumentPlan {
  return syncCanonicalQuoteDocumentPlan(data) as QuoteDocumentPlan;
}

export const buildQuoteDocumentComposition = buildCanonicalQuoteDocumentComposition;
export const syncLegacySectionFlagsFromDocumentPlan =
  syncCanonicalLegacySectionFlagsFromDocumentPlan;
export const getLegacyFlagForDocumentPlanSection =
  getCanonicalLegacyFlagForDocumentPlanSection;
export const getDocumentPlanSectionForLegacyFlag =
  getCanonicalDocumentPlanSectionForLegacyFlag;
export const isQuoteDocumentPlanSectionEnabled =
  isCanonicalQuoteDocumentPlanSectionEnabled;

export type QuoteComposition = QuoteDocumentPlan;

export function normalizeQuotePlanSeed(
  data: Record<string, unknown> | null | undefined,
) {
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  if (!record) {
    return undefined;
  }

  return {
    composition: record.composition,
    documentPlan: record.documentPlan,
  };
}
