import { renderQuotePdfWithJsonRender } from "@open-harness/quote-documents";

import { quoteDataSchema, type QuoteData } from "./schema";

export class PdfGenerationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "PdfGenerationError";
  }
}

export async function renderQuotePdf(data: QuoteData): Promise<Uint8Array> {
  const quoteData = quoteDataSchema.parse(data);

  try {
    return await renderQuotePdfWithJsonRender(quoteData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PDF rendering error";
    throw new PdfGenerationError(message || "Unknown PDF rendering error");
  }
}
