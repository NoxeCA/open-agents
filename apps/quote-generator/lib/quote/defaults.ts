import type { QuoteData } from "./schema";
export function emptyQuoteData(): Partial<QuoteData> {
  return {
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
}
