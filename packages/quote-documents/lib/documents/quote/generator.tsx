import React from 'react';
import { Document, renderToBuffer } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { FC } from 'react';
import { getTranslations, type Language } from '@/lib/locales/loader';
import type { QuoteData } from './types';
import type { PageNumberCollector } from './shared/pagination';
import { SECTION_KEYS } from './shared/pagination';
import { spacing } from './shared/styles';
import './shared/fonts';
import CoverPage from './pages/01-cover';
import TableOfContentsPage from './pages/02-table-of-contents/TableOfContentsPage';
import AboutUsPage from './pages/03-about-us/AboutUsPage';
import CulturePage from './pages/04-culture/CulturePage';
import CeoMessagePage from './pages/05-ceo-message/CeoMessagePage';
import TeamPage from './pages/06-team/TeamPage';
import PartnersPage from './pages/07-partners/PartnersPage';
import ProposalDescriptionPage from './pages/08-proposal-description/ProposalDescriptionPage';
import ServiceSections from './pages/09-service-section/ServiceSections';
import ProjectSummaryPage from './pages/10-project-summary/ProjectSummaryPage';
import OptionalPages from './pages/11-optional/OptionalPages';
import ExclusionsConditionsPage from './pages/12-exclusions-conditions/ExclusionsConditionsPage';
import TermsAndConditionsPage from './pages/13-terms-and-conditions/TermsAndConditionsPage';

// Load static assets once at module level
function loadAsset(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), 'public', filename);
    if (fs.existsSync(filePath)) {
      return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;
    }
  } catch (error) {
    console.warn(`Could not load ${filename}`);
  }
  return '';
}

const logoBase64 = loadAsset('noxe-logo-dark.png');
const hexPatternBase64 = loadAsset('topRight-hexagonal-pattern.png');
const hexPatternBottomRightBase64 = loadAsset('bottomRight-hexagonal-pattern.png');
const arrowsBase64 = loadAsset('three-arrows-dark.png');
const noxeXLogoBase64 = loadAsset('noxe-X-logo-dark.png');
const darkArrowBase64 = loadAsset('dark-arrow-right.png');
const grayArrowBase64 = loadAsset('gray-arrow-right.png');
const lightGrayArrowBase64 = loadAsset('lightGray-arrow-right.png');
const infoIconBase64 = loadAsset('info.png');

export const QuoteDocument: FC<{ data: QuoteData; pageNumbers: PageNumberCollector }> = ({ data, pageNumbers }) => {
  const selectedLang: Language = (data.lang?.toLowerCase().trim() || 'fr') as Language;
  const lang = getTranslations('quote', selectedLang);

  const pageHeader = data.documentType || '';

  return (
    <Document>
      <CoverPage
        data={data}
        logoBase64={logoBase64}
        hexPatternBase64={hexPatternBase64}
        lang={lang}
        selectedLang={selectedLang}
      />
      <TableOfContentsPage
        data={data}
        lang={lang}
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
        pageNumbers={pageNumbers}
      />
      {data.includeAboutUs !== false && (
        <AboutUsPage
          lang={lang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          noxeXLogoBase64={noxeXLogoBase64}
          pageNumbers={pageNumbers}
        />
      )}
      {data.includeCulture !== false && (
        <CulturePage
          lang={lang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          pageNumbers={pageNumbers}
        />
      )}
      {data.includeCeoMessage !== false && data.ceo && (
        <CeoMessagePage
          data={data}
          lang={lang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          hexPatternBase64={hexPatternBase64}
          arrowImages={{ dark: darkArrowBase64, gray: grayArrowBase64, lightGray: lightGrayArrowBase64 }}
          pageNumbers={pageNumbers}
        />
      )}
      {data.includeTeam !== false && data.team && (
        <TeamPage
          data={data}
          lang={lang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          pageNumbers={pageNumbers}
        />
      )}
      {data.includePartners !== false && (
        <PartnersPage
          lang={lang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          pageNumbers={pageNumbers}
        />
      )}
      <ProposalDescriptionPage
        data={data}
        lang={lang}
        selectedLang={selectedLang}
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
        pageNumbers={pageNumbers}
      />
      {data.services && data.services.length > 0 && (
        <ServiceSections
          data={data}
          lang={lang}
          selectedLang={selectedLang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          infoIconBase64={infoIconBase64}
          pageNumbers={pageNumbers}
        />
      )}
      <ProjectSummaryPage
        data={data}
        lang={lang}
        selectedLang={selectedLang}
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
        infoIconBase64={infoIconBase64}
        pageNumbers={pageNumbers}
      />
      {data.optionalPages && data.optionalPages.length > 0 && (
        <OptionalPages
          root={data}
          pages={data.optionalPages}
          lang={lang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          hexPatternBase64={hexPatternBottomRightBase64}
          pageNumbers={pageNumbers}
        />
      )}
      <ExclusionsConditionsPage
        data={data}
        lang={lang}
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
        infoIconBase64={infoIconBase64}
        pageNumbers={pageNumbers}
      />
      {data.includeTermsAndConditions !== false && (
        <TermsAndConditionsPage
          data={data}
          lang={lang}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          pageNumbers={pageNumbers}
        />
      )}
      {/* Future pages will be added here */}
    </Document>
  );
};

export async function generateQuotePDF(quoteData: QuoteData): Promise<Buffer> {
  try {
    console.log('Starting PDF generation for quote:', quoteData.quoteID);

    // Two-pass rendering for TOC page numbers
    const pageNumbers: PageNumberCollector = {};

    // Pass 1: render to populate page number collector (TOC shows placeholders)
    await renderToBuffer(<QuoteDocument data={quoteData} pageNumbers={pageNumbers} />);

    // Pass 2: render with real page numbers (TOC reads from populated collector)
    const renderedBuffer = await renderToBuffer(<QuoteDocument data={quoteData} pageNumbers={pageNumbers} />);

    // Stamp page numbers on every page except page 1 (cover) using pdf-lib
    const pdfDoc = await PDFDocument.load(renderedBuffer);
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync(path.join(process.cwd(), 'fonts', 'URWGeometricW03Bold.ttf'));
    const boldFont = await pdfDoc.embedFont(fontBytes);
    const totalPages = pdfDoc.getPageCount();

    for (let i = 1; i < totalPages; i++) { // skip page 0 (cover)
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const pageNum = String(i + 1).padStart(2, '0');
      const textWidth = boldFont.widthOfTextAtSize(pageNum, 24);
      // Page number at far right: right edge (width - 32px padding) - text width
      page.drawText(pageNum, {
        x: width - spacing.pagePadding - textWidth,
        y: 25,
        size: 24,
        font: boldFont,
        color: rgb(0.431, 0.435, 0.451), // #6E6F73
      });
    }

    const mainPdfBuffer = Buffer.from(await pdfDoc.save());
    console.log('Main PDF generated successfully, size:', mainPdfBuffer.length, 'bytes');

    // If there are no attached documents, return the main PDF
    if (!quoteData.attachedDocuments || quoteData.attachedDocuments.length === 0) {
      return mainPdfBuffer;
    }

    console.log(`Found ${quoteData.attachedDocuments.length} attached document(s) to append`);

    try {
      const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
      let successfullyAppended = 0;

      for (let i = 0; i < quoteData.attachedDocuments.length; i++) {
        const attachedDoc = quoteData.attachedDocuments[i];
        try {
          console.log(`Appending document ${i + 1}: ${attachedDoc.filename}`);

          if (!attachedDoc.base64Content) {
            console.warn(`Skipping document ${attachedDoc.filename}: no content provided`);
            continue;
          }

          const attachedPdfBuffer = Buffer.from(attachedDoc.base64Content, 'base64');
          const attachedPdfDoc = await PDFDocument.load(attachedPdfBuffer);
          const copiedPages = await mainPdfDoc.copyPages(
            attachedPdfDoc,
            attachedPdfDoc.getPageIndices()
          );

          copiedPages.forEach((page) => {
            mainPdfDoc.addPage(page);
          });

          successfullyAppended++;
          console.log(`Successfully appended ${copiedPages.length} page(s) from ${attachedDoc.filename}`);
        } catch (error) {
          console.warn(`Could not append document ${attachedDoc.filename}:`, error);
        }
      }

      if (successfullyAppended > 0) {
        const combinedPdfBytes = await mainPdfDoc.save();
        const combinedPdfBuffer = Buffer.from(combinedPdfBytes);
        console.log(
          `Combined PDF generated with ${successfullyAppended} attachment(s), total size:`,
          combinedPdfBuffer.length,
          'bytes'
        );
        return combinedPdfBuffer;
      } else {
        console.warn('No documents were successfully appended, returning main PDF only');
        return mainPdfBuffer;
      }
    } catch (error) {
      console.warn('Error processing attached documents, returning main PDF only:', error);
      return mainPdfBuffer;
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
