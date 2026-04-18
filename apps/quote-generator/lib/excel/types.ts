export type CellValue = string | number | boolean | null;

export type SheetData = {
  name: string;
  rows: CellValue[][];
  nRows: number;
  nCols: number;
};

export type ParsedWorkbook = {
  sheets: SheetData[];
  sheetByNormalizedName: Record<string, SheetData>;
};

export type Confidence = "high" | "medium" | "low";

export type NeedsConfirmation = {
  path: string;
  reason: string;
  suggestion?: unknown;
  confidence: Confidence;
};

export type SkeletonResult = {
  skeleton: unknown;
  needsConfirmation: NeedsConfirmation[];
  stats: {
    sheetsDetected: Record<string, string>;
    bomRowsExtracted: number;
    laborCategoriesExtracted: number;
    totalSheetsRead: number;
    matchedSheets: number;
    unmatchedSheets: string[];
    serviceSectionsExtracted: number;
  };
};

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
