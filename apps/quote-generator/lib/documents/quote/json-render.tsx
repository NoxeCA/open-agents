import fs from "fs";
import path from "path";
import { Document } from "@react-pdf/renderer";
import type { Spec } from "@json-render/core";
import { renderToBuffer } from "@json-render/react-pdf/render";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import type { ReactNode } from "react";

import { getTranslations, type Language } from "@/lib/locales/loader";

import {
  resolveQuoteDocumentRenderInput,
  type QuoteDocumentRenderInput,
} from "./composition";
import { quoteDocumentPlanSchema } from "./document-plan";
import {
  createLegacyQuoteSectionRenderContext,
  getEnabledLegacyQuoteSectionKeys,
  LEGACY_QUOTE_SECTION_ORDER,
  LEGACY_QUOTE_SECTION_TYPES,
  type LegacyQuoteSectionKey,
  type LegacyQuoteSectionRenderContext,
  type LegacyQuoteSectionRegistryType,
} from "./legacy-section-adapters";
import { createLegacyQuotePdfSectionRegistry } from "./legacy-section-registry";
import type { QuoteData } from "./schema";
import "./shared/fonts";
import type { PageNumberCollector } from "./shared/pagination";
import { resolveQuoteGeneratorPath } from "./shared/asset-paths";
import { spacing } from "./shared/styles";

export const QUOTE_JSON_RENDER_SECTION_ORDER = LEGACY_QUOTE_SECTION_ORDER;

export type QuoteJsonRenderSectionKey = LegacyQuoteSectionKey;

export type QuoteJsonRenderElementType =
  | "QuotePdfDocument"
  | LegacyQuoteSectionRegistryType;

export interface QuoteJsonRenderElement {
  type: QuoteJsonRenderElementType;
  props: Record<string, unknown>;
  children: string[];
}

export type QuoteJsonRenderSpec = Spec & {
  root: string;
  elements: Record<string, QuoteJsonRenderElement>;
};

type RegistryEntryArgs = {
  element: {
    props: {
      context: QuoteRenderContext;
    };
  };
  children?: ReactNode;
};

type RegistryEntry = (args: RegistryEntryArgs) => ReactNode;

type QuoteAssetBundle = {
  arrowsBase64: string;
  darkArrowBase64: string;
  grayArrowBase64: string;
  hexPatternBase64: string;
  hexPatternBottomRightBase64: string;
  infoIconBase64: string;
  lightGrayArrowBase64: string;
  logoBase64: string;
  noxeXLogoBase64: string;
};

type QuoteRenderContext = LegacyQuoteSectionRenderContext;

function loadAsset(filename: string): string {
  try {
    const filePath = resolveQuoteGeneratorPath("public", filename);
    if (fs.existsSync(filePath)) {
      return `data:image/png;base64,${fs.readFileSync(filePath).toString("base64")}`;
    }
  } catch {
    // Keep the PDF render resilient when an asset is unavailable.
  }

  return "";
}

const quoteAssets: QuoteAssetBundle = {
  arrowsBase64: loadAsset("three-arrows-dark.png"),
  darkArrowBase64: loadAsset("dark-arrow-right.png"),
  grayArrowBase64: loadAsset("gray-arrow-right.png"),
  hexPatternBase64: loadAsset("topRight-hexagonal-pattern.png"),
  hexPatternBottomRightBase64: loadAsset("bottomRight-hexagonal-pattern.png"),
  infoIconBase64: loadAsset("info.png"),
  lightGrayArrowBase64: loadAsset("lightGray-arrow-right.png"),
  logoBase64: loadAsset("noxe-logo-dark.png"),
  noxeXLogoBase64: loadAsset("noxe-X-logo-dark.png"),
};

function createQuoteRenderContext(
  input: QuoteDocumentRenderInput,
  pageNumbers: PageNumberCollector,
): QuoteRenderContext {
  const { data } = resolveQuoteDocumentRenderInput(input);
  const selectedLang = (data.lang?.toLowerCase().trim() || "fr") as Language;

  return createLegacyQuoteSectionRenderContext({
    assets: quoteAssets,
    data,
    lang: getTranslations("quote", selectedLang),
    pageNumbers,
    selectedLang,
  });
}

function resolvePlanDrivenSectionKeys(
  context: QuoteRenderContext,
  composition: unknown,
) {
  const parsedPlan = quoteDocumentPlanSchema.safeParse(composition);
  if (!parsedPlan.success) {
    return getEnabledLegacyQuoteSectionKeys(context);
  }

  const enabledByData = new Set(getEnabledLegacyQuoteSectionKeys(context));
  const orderedKeys = parsedPlan.data.sections
    .filter((section) => section.enabled && enabledByData.has(section.key))
    .map((section) => section.key as LegacyQuoteSectionKey);

  return orderedKeys.length > 0
    ? orderedKeys
    : getEnabledLegacyQuoteSectionKeys(context);
}

function createQuoteDocumentPdfRegistry() {
  return {
    registry: {
      QuotePdfDocument: ({ children }: RegistryEntryArgs) => (
        <Document>{children}</Document>
      ),
      ...createLegacyQuotePdfSectionRegistry().registry,
    } satisfies Record<QuoteJsonRenderElementType, RegistryEntry>,
  };
}

export function buildQuoteJsonRenderSpec(
  input: QuoteDocumentRenderInput,
): QuoteJsonRenderSpec {
  const pageNumbers: PageNumberCollector = {};
  const context = createQuoteRenderContext(input, pageNumbers);
  const { composition } = resolveQuoteDocumentRenderInput(input);
  const rootId = "quote-document-root";
  const sectionKeys = resolvePlanDrivenSectionKeys(context, composition);
  const elements: Record<string, QuoteJsonRenderElement> = {
    [rootId]: {
      children: [],
      props: {
        context,
      },
      type: "QuotePdfDocument",
    },
  };

  for (const sectionKey of sectionKeys) {
    const sectionId = `quote-section-${sectionKey}`;
    elements[rootId].children.push(sectionId);
    elements[sectionId] = {
      children: [],
      props: {
        context,
      },
      type: LEGACY_QUOTE_SECTION_TYPES[sectionKey],
    };
  }

  return {
    elements,
    root: rootId,
  };
}

async function stampPageNumbers(renderedBuffer: Uint8Array | Buffer) {
  const pdfDoc = await PDFDocument.load(renderedBuffer);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = fs.readFileSync(
    resolveQuoteGeneratorPath("fonts", "URWGeometricW03Bold.ttf"),
  );
  const boldFont = await pdfDoc.embedFont(fontBytes);
  const totalPages = pdfDoc.getPageCount();

  for (let pageIndex = 1; pageIndex < totalPages; pageIndex += 1) {
    const page = pdfDoc.getPage(pageIndex);
    const { width } = page.getSize();
    const pageNumber = String(pageIndex + 1).padStart(2, "0");
    const textWidth = boldFont.widthOfTextAtSize(pageNumber, 24);

    page.drawText(pageNumber, {
      color: rgb(0.431, 0.435, 0.451),
      font: boldFont,
      size: 24,
      x: width - spacing.pagePadding - textWidth,
      y: 25,
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

    for (const attachedDocument of quoteData.attachedDocuments) {
      try {
        if (!attachedDocument.base64Content) {
          continue;
        }

        const attachedPdfBuffer = Buffer.from(
          attachedDocument.base64Content,
          "base64",
        );
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
  input: QuoteDocumentRenderInput,
): Promise<Uint8Array> {
  const pageNumbers: PageNumberCollector = {};
  const context = createQuoteRenderContext(input, pageNumbers);
  const spec = buildQuoteJsonRenderSpec(input);
  const registry = createQuoteDocumentPdfRegistry();

  await renderToBuffer(spec, registry);

  const renderedBuffer = await renderToBuffer(spec, registry);
  const stampedBuffer = await stampPageNumbers(renderedBuffer);
  const finalBuffer = await appendAttachedDocuments(stampedBuffer, context.data);

  return new Uint8Array(finalBuffer);
}
