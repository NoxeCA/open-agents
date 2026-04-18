import type { QuoteData } from "./schema";
export function emptyQuoteData(): Partial<QuoteData> {
  return {
    lang: "fr",
    includeAboutUs: true,
    includeCulture: true,
    includeCeoMessage: true,
    includeTeam: true,
    includePartners: true,
    includeTermsAndConditions: true,
    services: [],
    exclusions: [],
    specialConditions: [],
    notes: [],
    paymentTerms: [],
  };
}
