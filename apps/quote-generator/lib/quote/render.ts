import type { QuoteData } from "./schema";

export class PdfValidationError extends Error {
  constructor(public readonly missingPaths: string[], public readonly rawDetails: unknown) {
    super(`PDF API rejected payload: ${missingPaths.join(", ")}`);
    this.name = "PdfValidationError";
  }
}
export class PdfAuthError extends Error { constructor() { super("PDF API auth failed"); this.name = "PdfAuthError"; } }
export class PdfGenerationError extends Error { constructor(msg: string) { super(msg); this.name = "PdfGenerationError"; } }

export async function callPdfApi(data: QuoteData): Promise<ArrayBuffer> {
  const url = process.env.NOXE_DOCUMENTS_URL;
  const key = process.env.NOXE_DOCUMENTS_API_KEY;
  if (!url) throw new PdfGenerationError("NOXE_DOCUMENTS_URL not set");
  if (!key) throw new PdfGenerationError("NOXE_DOCUMENTS_API_KEY not set");

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 40_000);
  try {
    const res = await fetch(`${url}/api/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify(data),
      signal: ctl.signal,
    });
    if (res.status === 401) throw new PdfAuthError();
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      const details = body?.details ?? [];
      const missingPaths = Array.isArray(details) ? details.map((d: any) => d.path).filter(Boolean) : [];
      throw new PdfValidationError(missingPaths, body);
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new PdfGenerationError(`PDF API ${res.status}: ${txt.slice(0, 300)}`);
    }
    return await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}
