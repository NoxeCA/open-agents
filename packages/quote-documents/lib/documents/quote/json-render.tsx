import fs from "fs";
import path from "path";
import type { ReactNode } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Spec } from "@json-render/core";
import { renderToBuffer } from "@json-render/react-pdf/render";

import { QuoteDocument } from "./generator";
import { quoteDataSchema, type QuoteData } from "./schema";
import type { PageNumberCollector } from "./shared/pagination";
import { spacing } from "./shared/styles";

export type QuoteJsonRenderSpec = Spec;

type RegistryEntry = (args: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) => ReactNode;

function createQuoteDocumentPdfRegistry(pageNumbers: PageNumberCollector) {
  return {
    registry: {
      LegacyQuoteDocument: ({ element }: Parameters<RegistryEntry>[0]) => {
        const data = quoteDataSchema.parse(element.props.data);

        return <QuoteDocument data={data} pageNumbers={pageNumbers} />;
      },
    } satisfies Record<string, RegistryEntry>,
  };
}

export function buildQuoteJsonRenderSpec(data: QuoteData): QuoteJsonRenderSpec {
  return {
    root: "quote-document-root",
    elements: {
      "quote-document-root": {
        type: "LegacyQuoteDocument",
        props: {
          data,
        },
        children: [],
      },
    },
  };
}

async function stampPageNumbers(renderedBuffer: Uint8Array | Buffer) {
  const pdfDoc = await PDFDocument.load(renderedBuffer);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = fs.readFileSync(
    path.join(process.cwd(), "fonts", "URWGeometricW03Bold.ttf"),
  );
  const boldFont = await pdfDoc.embedFont(fontBytes);
  const totalPages = pdfDoc.getPageCount();

  for (let pageIndex = 1; pageIndex < totalPages; pageIndex += 1) {
    const page = pdfDoc.getPage(pageIndex);
    const { width } = page.getSize();
    const pageNum = String(pageIndex + 1).padStart(2, "0");
    const textWidth = boldFont.widthOfTextAtSize(pageNum, 24);

    page.drawText(pageNum, {
      x: width - spacing.pagePadding - textWidth,
      y: 25,
      size: 24,
      font: boldFont,
      color: rgb(0.431, 0.435, 0.451),
    });
  }

  return Buffer.from(await pdfDoc.save());
}

async function appendAttachedDocuments(
  mainPdfBuffer: Buffer,
  quoteData: QuoteData,
) {
  if (
    !quoteData.attachedDocuments ||
    quoteData.attachedDocuments.length === 0
  ) {
    return mainPdfBuffer;
  }

  try {
    const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
    let successfullyAppended = 0;

    for (const attachedDoc of quoteData.attachedDocuments) {
      try {
        if (!attachedDoc.base64Content) {
          continue;
        }

        const attachedPdfBuffer = Buffer.from(attachedDoc.base64Content, "base64");
        const attachedPdfDoc = await PDFDocument.load(attachedPdfBuffer);
        const copiedPages = await mainPdfDoc.copyPages(
          attachedPdfDoc,
          attachedPdfDoc.getPageIndices(),
        );

        for (const page of copiedPages) {
          mainPdfDoc.addPage(page);
        }

        successfullyAppended += 1;
      } catch {
        // Ignore invalid attachment PDFs and keep the main quote render intact.
      }
    }

    if (successfullyAppended === 0) {
      return mainPdfBuffer;
    }

    return Buffer.from(await mainPdfDoc.save());
  } catch {
    return mainPdfBuffer;
  }
}

export async function renderQuotePdfWithJsonRender(
  input: QuoteData,
): Promise<Uint8Array> {
  const quoteData = quoteDataSchema.parse(input);
  const spec = buildQuoteJsonRenderSpec(quoteData);
  const pageNumbers: PageNumberCollector = {};

  await renderToBuffer(spec, createQuoteDocumentPdfRegistry(pageNumbers));
  const renderedBuffer = await renderToBuffer(
    spec,
    createQuoteDocumentPdfRegistry(pageNumbers),
  );

  const stampedBuffer = await stampPageNumbers(renderedBuffer);
  const finalBuffer = await appendAttachedDocuments(stampedBuffer, quoteData);

  return new Uint8Array(finalBuffer);
}
