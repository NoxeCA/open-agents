import { buildQuoteDocumentContent } from "@open-harness/quote-documents/lib/documents/quote/document-content";
import { buildQuoteDocumentState } from "./document/builder";
import {
  buildQuoteDocumentComposition,
  buildQuoteDocumentPlan,
} from "./document/document-plan";
import type { QuoteData } from "./schema";

export function emptyQuoteData(): Partial<QuoteData> {
  const base: Partial<QuoteData> & Record<string, unknown> = {
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
  const documentPlan = buildQuoteDocumentPlan(base);
  const documentContent = buildQuoteDocumentContent(base);

  return {
    ...base,
    composition: buildQuoteDocumentComposition(documentPlan),
    documentContent,
    documentPlan,
    document: buildQuoteDocumentState({
      ...base,
      documentContent,
      documentPlan,
    }),
  };
}
