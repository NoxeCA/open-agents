import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations, Language } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import type { ServiceSectionPageData } from './types';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { BomCardTop, BomDataRows } from './BomTable';
import OtherCostsTable from './OtherCostsTable';
import ZeroVentilationTable from './ZeroVentilationTable';
import TotalCostBox from './TotalCostBox';
import TaxDisclaimer from './TaxDisclaimer';
import { serviceSectionStyles as styles } from './styles';

const SectionHeaderRow: FC<{
  sectionNumber: number;
  sectionName: string;
}> = ({ sectionNumber, sectionName }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionNumber}>{String(sectionNumber).padStart(2, '0')}</Text>
    <Text style={styles.sectionName}>{sectionName}</Text>
  </View>
);

/** Inline marker that flows with content (no absolute position). */
const FlowMarker: FC<{
  collector: PageNumberCollector;
  sectionKey: string;
  position: 'start' | 'end';
}> = ({ collector, sectionKey, position }) => (
  <Text
    style={{ height: 0, fontSize: 0, lineHeight: 0 }}
    render={({ pageNumber }) => {
      if (!collector[sectionKey]) {
        collector[sectionKey] = { start: pageNumber, end: pageNumber };
      }
      if (position === 'start') {
        collector[sectionKey].start = pageNumber;
        collector[sectionKey].end = pageNumber;
      } else {
        collector[sectionKey].end = pageNumber;
      }
      return '';
    }}
  />
);

interface ServiceSectionsProps {
  data: ServiceSectionPageData;
  lang: QuoteTranslations;
  selectedLang: Language;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  infoIconBase64: string;
  pageNumbers: PageNumberCollector;
}

const ServiceSections: FC<ServiceSectionsProps> = ({
  data,
  lang,
  selectedLang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  infoIconBase64,
  pageNumbers,
}) => {
  const pages: React.ReactNode[] = [];

  data.services.forEach((service, serviceIndex) => {
    const sectionKey = SECTION_KEYS.serviceKey(serviceIndex);
    const isFirstEverService = serviceIndex === 0;
    const showBom =
      service.layout === 'itemized-with-price' ||
      service.layout === 'itemized-without-price';
    const items = service.bomItems || [];
    const hasBom = showBom && items.length > 0;
    const bomLayout = service.layout as 'itemized-with-price' | 'itemized-without-price';
    const hasOtherCosts = service.laborCategories && service.laborCategories.length > 0;

    // ── Page 1: Overview / Intro ──────────────────────────────────────────
    pages.push(
      <PageShell
        key={`${serviceIndex}-overview`}
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
      >
        <SectionMarker collector={pageNumbers} sectionKey={sectionKey} position="start" />

        <Text style={styles.projectTitle}>{data.projectTitle}</Text>

        {isFirstEverService && (
          <Text style={styles.projectIntro}>{data.projectIntro}</Text>
        )}

        <SectionHeaderRow
          sectionNumber={service.sectionNumber}
          sectionName={service.sectionName}
        />

        {service.description ? (
          <View style={styles.sectionBody}>
            <Text style={styles.sectionDescription}>{service.description}</Text>
          </View>
        ) : null}

        {/* If no BOM and no other costs and not zero-ventilation, end the section here */}
        {!hasBom && !hasOtherCosts && service.layout !== 'zero-ventilation' && (
          <>
            <TotalCostBox totalCost={service.totalCost} lang={lang} selectedLang={selectedLang} />
            <TaxDisclaimer lang={lang} infoIconBase64={infoIconBase64} />
            <FlowMarker collector={pageNumbers} sectionKey={sectionKey} position="end" />
          </>
        )}
      </PageShell>,
    );

    // ── Zero Ventilation: dark combined card ──────────────────────────────
    if (service.layout === 'zero-ventilation') {
      pages.push(
        <PageShell
          key={`${serviceIndex}-zero-vent`}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
        >
          <Text style={styles.projectTitle}>{data.projectTitle}</Text>
          <SectionHeaderRow
            sectionNumber={service.sectionNumber}
            sectionName={service.sectionName}
          />

          <ZeroVentilationTable
            sectionName={service.sectionName}
            bomSubtotal={service.bomSubtotal}
            laborCategories={service.laborCategories}
            totalCost={service.totalCost}
            lang={lang}
            selectedLang={selectedLang}
          />

          <TotalCostBox totalCost={service.totalCost} lang={lang} selectedLang={selectedLang} />
          <TaxDisclaimer lang={lang} infoIconBase64={infoIconBase64} />
          <FlowMarker collector={pageNumbers} sectionKey={sectionKey} position="end" />
        </PageShell>,
      );
    }

    // ── Page 2: BOM Table ─────────────────────────────────────────────────
    if (hasBom) {
      pages.push(
        <PageShell
          key={`${serviceIndex}-bom`}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
          bottomReserve={24}
        >
          {/* Fixed top block — repeats on every overflow page */}
          <View fixed>
            <Text style={styles.projectTitle}>{data.projectTitle}</Text>
            <SectionHeaderRow
              sectionNumber={service.sectionNumber}
              sectionName={service.sectionName}
            />
            <BomCardTop
              sectionName={service.sectionName}
              layout={bomLayout}
              lang={lang}
            />
          </View>

          <BomDataRows
            items={items}
            subtotal={service.bomSubtotal}
            layout={bomLayout}
            lang={lang}
            selectedLang={selectedLang}
          />

          {/* If no other costs, put total + tax right under BOM */}
          {!hasOtherCosts && (
            <>
              <TotalCostBox totalCost={service.totalCost} lang={lang} selectedLang={selectedLang} />
              <TaxDisclaimer lang={lang} infoIconBase64={infoIconBase64} />
            </>
          )}

          <FlowMarker collector={pageNumbers} sectionKey={sectionKey} position="end" />
        </PageShell>,
      );
    }

    // ── Page 3: Other Costs + Total + Tax ─────────────────────────────────
    if (hasOtherCosts) {
      pages.push(
        <PageShell
          key={`${serviceIndex}-costs`}
          pageHeader={pageHeader}
          logoBase64={logoBase64}
          arrowsBase64={arrowsBase64}
        >
          <Text style={styles.projectTitle}>{data.projectTitle}</Text>

          <SectionHeaderRow
            sectionNumber={service.sectionNumber}
            sectionName={service.sectionName}
            />

          <OtherCostsTable
            items={service.laborCategories!}
            subtotal={service.laborSubtotal}
            sectionName={service.sectionName}
            lang={lang}
            selectedLang={selectedLang}
          />

          <TotalCostBox totalCost={service.totalCost} lang={lang} selectedLang={selectedLang} />
          <TaxDisclaimer lang={lang} infoIconBase64={infoIconBase64} />

          <FlowMarker collector={pageNumbers} sectionKey={sectionKey} position="end" />
        </PageShell>,
      );
    }
  });

  return <>{pages}</>;
};

export default ServiceSections;
