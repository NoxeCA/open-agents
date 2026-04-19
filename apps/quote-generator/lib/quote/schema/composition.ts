import {
  quoteDocumentPlanArchetypeSchema,
  quoteDocumentPlanCommercialPresetSchema,
  quoteDocumentPlanDetailLevelSchema,
  quoteDocumentPlanSchema,
  quoteDocumentPlanPresetSchema,
  quoteDocumentPlanSectionKeySchema,
  quoteDocumentPlanSectionSelectionSchema,
  quoteDocumentPlanSectionVariantSchema,
  quoteDocumentPlanServiceLayoutSchema,
  type QuoteDocumentPlanArchetype,
  type QuoteDocumentPlanCommercialPreset,
  type QuoteDocumentPlanDetailLevel,
  type QuoteDocumentPlan,
  type QuoteDocumentPlanPreset,
  type QuoteDocumentPlanSectionKey,
  type QuoteDocumentPlanSectionSelection,
  type QuoteDocumentPlanSectionVariant,
  type QuoteDocumentPlanServiceLayout,
} from "../document/catalog";
import {
  buildQuoteDocumentComposition,
  buildQuoteDocumentPlan,
  getDocumentPlanSectionForLegacyFlag,
  getLegacyFlagForDocumentPlanSection,
  isQuoteDocumentPlanSectionEnabled,
  syncLegacySectionFlagsFromDocumentPlan,
  syncQuoteDocumentPlan,
} from "../document/document-plan";
import type { QuoteData } from "../schema";

export const quoteCompositionSchema = quoteDocumentPlanSchema.passthrough();
export const quoteCompositionVersionSchema = quoteCompositionSchema.shape.version;
export const quoteCompositionArchetypeSchema = quoteDocumentPlanArchetypeSchema;
export const quoteCompositionPresetSchema = quoteDocumentPlanPresetSchema;
export const quoteCompositionDetailLevelSchema = quoteDocumentPlanDetailLevelSchema;
export const quoteCompositionSectionKeySchema = quoteDocumentPlanSectionKeySchema;
export const quoteCompositionSectionVariantSchema =
  quoteDocumentPlanSectionVariantSchema;
export const quoteCompositionSectionSchema = quoteDocumentPlanSectionSelectionSchema;
export const quoteCompositionServiceLayoutPolicySchema =
  quoteDocumentPlanServiceLayoutSchema;
export const quoteCompositionCommercialPresetSchema =
  quoteDocumentPlanCommercialPresetSchema;

export type QuoteComposition = QuoteDocumentPlan;
export type QuoteCompositionArchetype = QuoteDocumentPlanArchetype;
export type QuoteCompositionPreset = QuoteDocumentPlanPreset;
export type QuoteCompositionDetailLevel = QuoteDocumentPlanDetailLevel;
export type QuoteCompositionSectionKey = QuoteDocumentPlanSectionKey;
export type QuoteCompositionSectionVariant = QuoteDocumentPlanSectionVariant;
export type QuoteCompositionServiceLayoutPolicy = QuoteDocumentPlanServiceLayout;
export type QuoteCompositionCommercialPreset = QuoteDocumentPlanCommercialPreset;
export type QuoteCompositionSection = QuoteDocumentPlanSectionSelection;

export function buildQuoteCompositionState(
  data: Partial<QuoteData> & Record<string, unknown>,
): QuoteComposition {
  return buildQuoteDocumentComposition(buildQuoteDocumentPlan(data));
}

export function syncQuoteComposition(
  data: Partial<QuoteData> & Record<string, unknown>,
) {
  return buildQuoteDocumentComposition(syncQuoteDocumentPlan(data));
}

export { getDocumentPlanSectionForLegacyFlag };
export { getLegacyFlagForDocumentPlanSection };
export { isQuoteDocumentPlanSectionEnabled };
export { syncLegacySectionFlagsFromDocumentPlan };
