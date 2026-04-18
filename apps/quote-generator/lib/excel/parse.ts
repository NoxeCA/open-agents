import * as XLSX from "xlsx";
import { normalizeName, type ParsedWorkbook, type SheetData } from "./types";

const MAX_ROWS = 500;
const MAX_COLS = 50;

export async function parseWorkbook(buffer: ArrayBuffer): Promise<ParsedWorkbook> {
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
  const sheets: SheetData[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const all = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: null,
      raw: true,
    });
    const rows = (all as unknown[][])
      .slice(0, MAX_ROWS)
      .map((r) => ((r ?? []) as unknown[]).slice(0, MAX_COLS)) as SheetData["rows"];
    return {
      name,
      rows,
      nRows: rows.length,
      nCols: rows.reduce((m, r) => Math.max(m, r.length), 0),
    };
  });
  const sheetByNormalizedName: Record<string, SheetData> = {};
  for (const s of sheets) sheetByNormalizedName[normalizeName(s.name)] = s;
  return { sheets, sheetByNormalizedName };
}
