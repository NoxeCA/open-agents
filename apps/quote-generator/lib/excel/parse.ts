import * as XLSX from "xlsx";
import { normalizeName, type CellValue, type ParsedWorkbook, type SheetData } from "./types";

function toCellValue(cell: XLSX.CellObject | undefined): CellValue {
  if (!cell || cell.v === undefined || cell.v === null || cell.v === "") {
    return null;
  }

  const value = cell.v;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

function trimTrailingEmptyCells(row: Array<CellValue | undefined>) {
  const next = row.map((value) => (value === undefined ? null : value));

  while (next.length > 0) {
    const last = next.at(-1);
    if (last !== null && last !== "") {
      break;
    }
    next.pop();
  }

  return next;
}

function parseSheet(name: string, sheet: XLSX.WorkSheet): SheetData {
  const cellEntries = Object.entries(sheet).filter(([address]) => !address.startsWith("!"));
  if (cellEntries.length === 0) {
    return {
      name,
      rows: [],
      nRows: 0,
      nCols: 0,
    };
  }

  const rowMap = new Map<number, Array<CellValue | undefined>>();
  let maxRowIndex = -1;

  for (const [address, rawCell] of cellEntries) {
    const { r, c } = XLSX.utils.decode_cell(address);
    const row = rowMap.get(r) ?? [];
    row[c] = toCellValue(rawCell);
    rowMap.set(r, row);
    if (r > maxRowIndex) {
      maxRowIndex = r;
    }
  }

  const rows = Array.from({ length: maxRowIndex + 1 }, (_, rowIndex) =>
    trimTrailingEmptyCells(rowMap.get(rowIndex) ?? []),
  );

  while (rows.length > 0 && rows.at(-1)?.length === 0) {
    rows.pop();
  }

  return {
    name,
    rows,
    nRows: rows.length,
    nCols: rows.reduce((max, row) => Math.max(max, row.length), 0),
  };
}

export async function parseWorkbook(buffer: ArrayBuffer): Promise<ParsedWorkbook> {
  const wb = XLSX.read(new Uint8Array(buffer), {
    type: "array",
    cellDates: true,
  });

  const sheets: SheetData[] = wb.SheetNames.map((name) =>
    parseSheet(name, wb.Sheets[name]),
  );

  const sheetByNormalizedName: Record<string, SheetData> = {};
  for (const sheet of sheets) {
    sheetByNormalizedName[normalizeName(sheet.name)] = sheet;
  }

  return { sheets, sheetByNormalizedName };
}
