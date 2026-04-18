import { z } from "zod";

export const attachmentConfidenceSchema = z.enum(["low", "medium", "high"]);

export const attachmentQuoteFieldHintSchema = z.object({
  label: z
    .string()
    .describe("Short label for the extracted fact, e.g. Customer email"),
  value: z
    .string()
    .describe("The extracted value or concise statement"),
  confidence: attachmentConfidenceSchema,
  quotePathHint: z
    .string()
    .optional()
    .describe(
      "Optional QuoteData field hint using dot-path notation, e.g. contactInfo.email",
    ),
});

export const contextFileAnalysisSchema = z.object({
  evidenceQuotes: z
    .array(z.string())
    .max(8)
    .describe(
      "Short verbatim quotes or exact snippets from the attachment that support the extraction. Prefer the most decision-relevant lines.",
    ),
  summary: z
    .string()
    .describe(
      "A concise 3-6 sentence summary of what this attachment adds to the quote context.",
    ),
  customerSignals: z
    .array(z.string())
    .max(8)
    .describe("Customer-specific facts, stakeholders, requests, or preferences."),
  scopeSignals: z
    .array(z.string())
    .max(12)
    .describe("Project scope, site, system, or plan details relevant to the quote."),
  commercialSignals: z
    .array(z.string())
    .max(10)
    .describe("Commercial constraints, deadlines, quote references, totals, or terms."),
  quoteFieldHints: z
    .array(attachmentQuoteFieldHintSchema)
    .max(12)
    .describe(
      "Candidate quote-relevant facts that the main agent can patch or confirm later.",
    ),
  needsConfirmation: z
    .array(z.string())
    .max(8)
    .describe("Ambiguous facts or follow-up questions created by this attachment."),
});

export type ContextFileAnalysis = z.infer<typeof contextFileAnalysisSchema>;
