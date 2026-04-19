import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeQuoteData } from "../lib/quote/normalize";
import { renderQuotePdf } from "../lib/quote/render";
import { quoteDataSchema } from "../lib/quote/schema";

const appRoot = process.cwd();
const sampleJsonPath = path.join(
  appRoot,
  "examples",
  "quote-json-render.sample.json",
);
const outputDir = path.join(appRoot, ".local", "smoke-tests");
const outputPdfPath = path.join(outputDir, "quote-json-render.sample.pdf");
const outputNormalizedJsonPath = path.join(
  outputDir,
  "quote-json-render.sample.normalized.json",
);

async function main() {
  const rawJson = await readFile(sampleJsonPath, "utf8");
  const input = JSON.parse(rawJson) as Record<string, unknown>;
  const normalized = quoteDataSchema.parse(normalizeQuoteData(input));
  const pdf = await renderQuotePdf(normalized);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPdfPath, pdf);
  await writeFile(
    outputNormalizedJsonPath,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        input: sampleJsonPath,
        normalized: outputNormalizedJsonPath,
        pdf: outputPdfPath,
        pdfBytes: pdf.length,
      },
      null,
      2,
    ),
  );
}

await main();
