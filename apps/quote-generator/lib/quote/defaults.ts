import { buildQuoteDocumentState } from "./document/builder";
import type { QuoteData } from "./schema";

export function emptyQuoteData(): Partial<QuoteData> {
  const base: Partial<QuoteData> = {
    lang: "fr",
    includeAboutUs: false,
    includeCulture: false,
    includeCeoMessage: false,
    includeTeam: false,
    includePartners: false,
    includeTermsAndConditions: true,
    services: [],
    exclusions: [],
    specialConditions: [],
    notes: [],
    paymentTerms: [],
  };

  return {
    ...base,
    document: buildQuoteDocumentState(base),
  };
}
