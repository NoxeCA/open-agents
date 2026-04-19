import { generateQuotePDF } from "@/lib/documents/quote/generator";

import { quoteDataSchema, type QuoteData } from "./schema";

export class PdfGenerationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "PdfGenerationError";
  }
}

export async function renderQuotePdf(
  data: QuoteData,
  options?: { quoteId?: string },
): Promise<Uint8Array> {
  const quoteData = quoteDataSchema.parse(data);
  const renderData = {
    ...(data as Record<string, unknown>),
    ...(quoteData as Record<string, unknown>),
  } as QuoteData;
  void options;

  try {
    return await generateQuotePDF(renderData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PDF rendering error";
    throw new PdfGenerationError(message || "Unknown PDF rendering error");
  }
}
