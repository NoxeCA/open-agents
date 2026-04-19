import React from 'react';
import fs from 'fs';
import path from 'path';
import { Document, renderToBuffer } from '@react-pdf/renderer';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import './env'; // side-effect: font registration + asset load
import { buildBrandConfig, runWithBrand } from './brand';
import { specDocumentSchema, specEnvelopeSchema, type SpecDocument, type SpecEnvelope } from './spec/schema';
import { resolveBindings } from './spec/bindings';
import { enforceLimits } from './spec/limits';
import { checkIntegrity, IntegrityError } from './spec/integrity';
import { resolveQuoteGeneratorPath } from '@/lib/documents/quote/shared/asset-paths';
import { PageRenderer } from './registry/react-pdf';
import { ServiceSectionRenderer } from './registry/react-pdf/ServiceSection';
import { runWithPageNumbers } from './registry/react-pdf/page-numbers';
import type { PageNumberCollector } from '@/lib/documents/quote/shared/pagination';
import { spacing } from '@/lib/documents/quote/shared/styles';

function RenderedDocument({
  spec,
}: {
  spec: SpecDocument;
}) {
  return (
    <Document>
      {spec.document.children.map((child, idx) => {
        if (child.type === 'ServiceSection') {
          return <ServiceSectionRenderer key={idx} {...(child as any)} />;
        }
        return <PageRenderer key={idx} node={child as any} />;
      })}
    </Document>
  );
}

async function appendAttachments(
  mainPdfBuffer: Buffer,
  attachments: { filename: string; base64Content: string }[]
): Promise<Buffer> {
  try {
    const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
    let appended = 0;
    for (const attachedDoc of attachments) {
      try {
        if (!attachedDoc.base64Content) continue;
        const attachedPdfBuffer = Buffer.from(attachedDoc.base64Content, 'base64');
        const attachedPdfDoc = await PDFDocument.load(attachedPdfBuffer);
        const copiedPages = await mainPdfDoc.copyPages(
          attachedPdfDoc,
          attachedPdfDoc.getPageIndices()
        );
        copiedPages.forEach(page => mainPdfDoc.addPage(page));
        appended++;
      } catch (err) {
        console.warn(`Could not append document ${attachedDoc.filename}:`, err);
      }
    }
    if (appended > 0) {
      return Buffer.from(await mainPdfDoc.save());
    }
    return mainPdfBuffer;
  } catch (err) {
    console.warn('Error processing attached documents, returning main PDF only:', err);
    return mainPdfBuffer;
  }
}

async function stampPageNumbers(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(
    resolveQuoteGeneratorPath('fonts', 'URWGeometricW03Bold.ttf')
  );
  const boldFont = await pdfDoc.embedFont(fontBytes);
  const totalPages = pdfDoc.getPageCount();

  // Skip page 0 (cover) — matches the legacy generator.tsx behavior.
  for (let i = 1; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width } = page.getSize();
    const pageNum = String(i + 1).padStart(2, '0');
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

export async function renderSpec(input: SpecEnvelope | SpecDocument): Promise<Buffer> {
  // Pass 0: resolve bindings against variables, using the envelope form.
  const envelope = specEnvelopeSchema.parse(input);
  enforceLimits(envelope);
  const variables = (envelope.variables ?? {}) as Record<string, unknown>;
  const expanded = resolveBindings(envelope, variables);
  enforceLimits(expanded);
  const resolved = specDocumentSchema.parse(expanded);

  // Referential-integrity pass: surface dangling TOC refs and bogus Image.src
  // before react-pdf silently renders broken output.
  const issues = checkIntegrity(resolved);
  const fatal = issues.filter(
    i => i.kind === 'toc-dangling' || i.kind === 'image-unknown-asset'
  );
  const warnings = issues.filter(i => i.kind === 'duplicate-section-id');
  for (const w of warnings) {
    console.warn(
      `[json-render] duplicate sectionId "${w.sectionId}" at ${w.path}`
    );
  }
  if (fatal.length > 0) {
    throw new IntegrityError(issues);
  }

  // Two-pass render to populate the TOC page-number collector.
  const pageNumbers: PageNumberCollector = {};
  const brand = buildBrandConfig(resolved.document.lang, resolved.brand);

  // Pass 1: warm the collector. Output is discarded.
  await runWithBrand(brand, () =>
    runWithPageNumbers(pageNumbers, () =>
      renderToBuffer(<RenderedDocument spec={resolved} />),
    ),
  );

  // Pass 2: real render with the populated collector.
  let mainPdfBuffer = await runWithBrand(brand, () =>
    runWithPageNumbers(pageNumbers, () =>
      renderToBuffer(<RenderedDocument spec={resolved} />),
    ),
  );

  // Stamp page numbers on every page except the cover.
  mainPdfBuffer = await stampPageNumbers(mainPdfBuffer);

  if (!resolved.attachments || resolved.attachments.length === 0) {
    return mainPdfBuffer;
  }
  return appendAttachments(mainPdfBuffer, resolved.attachments);
}
