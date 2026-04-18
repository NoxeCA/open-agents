import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { downloadBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { quoteFiles } from "@/lib/db/schema";
import { parseWorkbook } from "@/lib/excel/parse";

import type { ParseExcelOutput } from "../tool-types";

function isNonEmptyRow(row: unknown[]) {
  return row.some((value) => value !== null && value !== "");
}

export function parseExcelTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Parse an uploaded Excel file and return a workbook-wide summary covering every sheet. Use this immediately after the user uploads an Excel file. After this completes, call `propose_quote_skeleton` with the same fileId before asking clarifying questions.",
    inputSchema: z.object({
      fileId: z
        .string()
        .describe(
          "The fileId returned by the upload endpoint when the user attached the Excel file.",
        ),
    }),
    execute: async ({ fileId }): Promise<ParseExcelOutput> => {
      const [row] = await db
        .select()
        .from(quoteFiles)
        .where(
          and(
            eq(quoteFiles.id, fileId),
            eq(quoteFiles.quoteId, quoteId),
            eq(quoteFiles.kind, "excel"),
          ),
        )
        .limit(1);

      if (!row) {
        return { ok: false, error: "File not found for this quote" };
      }

      try {
        const buf = await downloadBlob(row.blobUrl);
        const wb = await parseWorkbook(buf);

        return {
          ok: true,
          sheetSummaries: wb.sheets.map((s) => ({
            name: s.name,
            nRows: s.nRows,
            nCols: s.nCols,
            nonEmptyRows: s.rows.filter((row) => isNonEmptyRow(row)).length,
          })),
          firstRowsPreview: Object.fromEntries(
            wb.sheets.map((s) => [
              s.name,
              s.rows.filter((row) => isNonEmptyRow(row)).slice(0, 8),
            ]),
          ),
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: `Failed to parse workbook: ${message}` };
      }
    },
  });
}
