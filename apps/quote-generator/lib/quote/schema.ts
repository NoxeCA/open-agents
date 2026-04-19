export {
  quoteBusinessDataSchema,
  quoteCompositionSchema,
  quoteDocumentContentSchema,
  quoteDataSchema,
  type QuoteBusinessData,
  type QuoteComposition,
  type QuoteData,
  type QuoteDocumentContent,
} from "./schema/index";
export {
  quoteCompositionSchema as quoteDocumentPlanSchema,
  type QuoteComposition as QuoteDocumentPlan,
} from "./schema/composition";
export {
  buildQuoteDocumentContent,
  buildQuoteDocumentRegionId,
  createEmptyQuoteDocumentContent,
  createQuoteDocumentRegion,
  parseQuoteDocumentRegionId,
  type QuoteDocumentContentRegion,
  type QuoteDocumentContentSeedInput,
  type QuoteDocumentRegion,
  type QuoteDocumentRegionId,
  type QuoteDocumentRegionTarget,
  type QuoteDocumentRegions,
} from "./schema/document-content";
