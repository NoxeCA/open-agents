// Input / output types for the agent tools, shared with UI renderers.
//
// These mirror the zod `inputSchema`s and `execute` return shapes declared in
// the tool files. UI renderers should import from here (not from the tool
// files) so the Next.js client bundle doesn't pull in server-only deps like
// drizzle, @vercel/blob, etc.

import type { Operation } from "fast-json-patch";

// ---- parse_excel --------------------------------------------------------

export type ParseExcelInput = { fileId: string };

export type SheetSummary = {
  name: string;
  nRows: number;
  nCols: number;
  nonEmptyRows: number;
};

export type ParseExcelOutput =
  | {
      ok: true;
      sheetSummaries: SheetSummary[];
      firstRowsPreview: Record<string, unknown[][]>;
    }
  | { ok: false; error: string };

// ---- propose_quote_skeleton --------------------------------------------

export type ProposeQuoteSkeletonInput = { fileId: string };

export type ProposeQuoteSkeletonStats = {
  sheetsRead: number;
  sheetsConsidered: number;
  unmatchedSheets: string[];
  partsDetected: number;
  servicesDetected: number;
};

export type ProposeQuoteSkeletonOutput =
  | {
      ok: true;
      proposedKeys: string[];
      needsConfirmation: string[];
      stats: ProposeQuoteSkeletonStats;
    }
  | { ok: false; error: string };

// ---- patch_quote -------------------------------------------------------

export type PatchQuoteOp = {
  op: "add" | "replace" | "remove" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
};

export type PatchQuoteInput = { ops: PatchQuoteOp[] };

export type PatchQuoteIssue = {
  path: string;
  message: string;
};

export type PatchQuoteOutput =
  | {
      ok: true;
      touchedPaths: string[];
      issues: PatchQuoteIssue[];
    }
  | { ok: false; error: string };

// Re-export fast-json-patch's Operation for tool implementations that want the
// strict shape.
export type { Operation };

// ---- document tools ----------------------------------------------------

export type DocumentThemeId = "editorial" | "executive" | "technical";
export type DocumentDensityId = "airy" | "balanced" | "compact";
export type DocumentAccentId = "sand" | "forest" | "ink";
export type DocumentSectionKind =
  | "cover"
  | "overview"
  | "services"
  | "about"
  | "culture"
  | "leadership"
  | "team"
  | "partners"
  | "commercial";

export type DocumentCatalogOption = {
  id: string;
  label: string;
  description: string;
};

export type DocumentCatalogSection = {
  kind: DocumentSectionKind;
  label: string;
  description: string;
  optional: boolean;
};

export type DocumentCatalogOutput = {
  themes: DocumentCatalogOption[];
  densities: DocumentCatalogOption[];
  accents: DocumentCatalogOption[];
  sections: DocumentCatalogSection[];
  components: string[];
};

export type DocumentSummary = {
  theme: DocumentThemeId;
  density: DocumentDensityId;
  accent: DocumentAccentId;
  pageCount: number;
  sections: string[];
};

export type ComposeDocumentSpecInput = {
  theme?: DocumentThemeId;
  density?: DocumentDensityId;
  accent?: DocumentAccentId;
  sectionOrder?: DocumentSectionKind[];
  includeSections?: DocumentSectionKind[];
  excludeSections?: DocumentSectionKind[];
};

export type ComposeDocumentSpecOutput =
  | {
      ok: true;
      summary: DocumentSummary;
      touchedPaths: string[];
    }
  | {
      ok: false;
      error: string;
    };

export type PatchDocumentSpecInput = { ops: PatchQuoteOp[] };

export type PatchDocumentSpecOutput =
  | {
      ok: true;
      touchedPaths: string[];
      issues: PatchQuoteIssue[];
      summary: DocumentSummary;
    }
  | { ok: false; error: string };

// ---- ask_user_question -------------------------------------------------

export type AskUserQuestionOption = {
  label: string;
  description: string;
};

export type AskUserQuestion = {
  question: string;
  header: string;
  options: AskUserQuestionOption[];
  multiSelect: boolean;
};

export type AskUserQuestionInput = {
  questions: AskUserQuestion[];
};

export type AskUserQuestionOutput =
  | { answers: Record<string, string | string[]> }
  | { declined: true };

// ---- inspect_context_file ----------------------------------------------

export type InspectContextFileInput = {
  fileId: string;
  focus?: string;
};

export type InspectContextFieldHint = {
  label: string;
  value: string;
  confidence: "low" | "medium" | "high";
  quotePathHint?: string;
};

export type InspectContextFileOutput =
  | {
      ok: true;
      fileId: string;
      filename: string;
      mediaType: string;
      evidenceQuotes: string[];
      summary: string;
      customerSignals: string[];
      scopeSignals: string[];
      commercialSignals: string[];
      quoteFieldHints: InspectContextFieldHint[];
      needsConfirmation: string[];
    }
  | {
      ok: false;
      error: string;
      errorCode?:
        | "provider_billing"
        | "provider_execution"
        | "attachment_processing";
    };

// ---- render_pdf --------------------------------------------------------

export type RenderPdfInput = Record<string, never>;

export type RenderPdfOutput =
  | {
      ok: true;
      pdfFileId: string;
      pdfUrl: string;
    }
  | {
      ok: false;
      error: string;
      missingPaths?: string[];
      blockingIssues?: string[];
    };

// ---- list_quote_layouts ------------------------------------------------

export type QuoteLayoutId =
  | "zero-ventilation"
  | "itemized-without-price"
  | "itemized-with-price";

export type QuoteLayoutDescription = {
  layout: QuoteLayoutId;
  description: string;
};

export type ListQuoteLayoutsInput = Record<string, never>;

export type ListQuoteLayoutsOutput = QuoteLayoutDescription[];
