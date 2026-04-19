import React, { FC } from 'react';
import { Page as RPdfPage, Text, View, Image } from '@react-pdf/renderer';
import { basePageStyle, spacing } from '@/lib/documents/quote/shared/styles';
import { serviceSectionStyles as styles } from '@/lib/documents/quote/pages/09-service-section/styles';
import {
  BomCardTop,
  BomDataRows,
} from '@/lib/documents/quote/pages/09-service-section/BomTable';
import OtherCostsTable from '@/lib/documents/quote/pages/09-service-section/OtherCostsTable';
import ZeroVentilationTable from '@/lib/documents/quote/pages/09-service-section/ZeroVentilationTable';
import { formatCurrency } from '@/lib/documents/quote/shared/formatters';
import { SECTION_KEYS } from '@/lib/documents/quote/shared/pagination';
import { useBrand } from '../../brand';
import { usePageNumbers } from './page-numbers';
import type { ServiceSectionProps } from '../../catalog/tables/primitives';

const chromeStyles = {
  page: {
    ...basePageStyle,
    padding: spacing.pagePadding,
    flexDirection: 'column' as const,
  },
  pageHeader: {
    fontFamily: 'URWGeometric' as const,
    fontWeight: 700 as const,
    fontSize: 14,
    lineHeight: 1.14,
    marginBottom: 24,
  },
  content: { flex: 1 },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    height: 33,
  },
  footerLogo: { width: 64, height: 17 },
  footerArrows: {
    position: 'absolute' as const,
    right: 30,
    bottom: -10,
    width: 18,
    height: 18,
  },
};

const Shell: FC<{
  children: React.ReactNode;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  bottomReserve?: number;
}> = ({ children, pageHeader, logoBase64, arrowsBase64, bottomReserve }) => {
  const brand = useBrand();
  return (
    <RPdfPage size="LETTER" style={chromeStyles.page}>
      {pageHeader && (
        <Text style={{ ...chromeStyles.pageHeader, color: brand.colors.gray }} fixed>
          {pageHeader}
        </Text>
      )}
      <View
        style={
          bottomReserve
            ? { ...chromeStyles.content, paddingBottom: bottomReserve }
            : chromeStyles.content
        }
      >
        {children}
      </View>
      <View style={chromeStyles.footer} fixed>
        {logoBase64 ? <Image style={chromeStyles.footerLogo} src={logoBase64} /> : <View />}
        {arrowsBase64 && <Image style={chromeStyles.footerArrows} src={arrowsBase64} />}
      </View>
    </RPdfPage>
  );
};

const SectionHeaderRow: FC<{ sectionNumber: number; sectionName: string }> = ({
  sectionNumber,
  sectionName,
}) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionNumber}>{String(sectionNumber).padStart(2, '0')}</Text>
    <Text style={styles.sectionName}>{sectionName}</Text>
  </View>
);

const FlowMarker: FC<{ sectionKey: string; position: 'start' | 'end' }> = ({
  sectionKey,
  position,
}) => {
  const pn = usePageNumbers();
  return (
    <Text
      style={{ height: 0, fontSize: 0, lineHeight: 0 }}
      render={({ pageNumber }) => {
        if (!pn[sectionKey]) pn[sectionKey] = { start: pageNumber, end: pageNumber };
        if (position === 'start') {
          pn[sectionKey].start = pageNumber;
          pn[sectionKey].end = pageNumber;
        } else {
          pn[sectionKey].end = pageNumber;
        }
        return '';
      }}
    />
  );
};

const TotalRow: FC<{ amount: number }> = ({ amount }) => {
  const brand = useBrand();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: brand.colors.dark,
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
      wrap={false}
    >
      <View
        style={{ width: 4, height: '100%', backgroundColor: brand.colors.cyan, marginRight: 12 }}
      />
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 700,
          fontSize: 14,
          color: brand.colors.white,
          flex: 1,
        }}
      >
        {brand.translations.common.totalCost}
      </Text>
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 700,
          fontSize: 18,
          color: brand.colors.cyan,
        }}
      >
        {formatCurrency(amount, brand.lang)}
      </Text>
    </View>
  );
};

const InlineTaxDisclaimer: FC = () => {
  const brand = useBrand();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}
      wrap={false}
    >
      {brand.assets.infoIcon && (
        <Image style={{ width: 10, height: 10 }} src={brand.assets.infoIcon} />
      )}
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontSize: 8,
          color: brand.colors.gray,
        }}
      >
        {brand.translations.common.taxDisclaimer}
      </Text>
    </View>
  );
};

/**
 * ServiceSection emits 1-3 react-pdf <Page> elements, mirroring the legacy
 * ServiceSections.tsx. Document-level node.
 */
export const ServiceSectionRenderer: FC<ServiceSectionProps> = service => {
  const brand = useBrand();
  const lang = brand.translations;
  const selectedLang = brand.lang;
  const pageHeader = lang.common.proposal ?? 'PROPOSAL';
  const logoBase64 = brand.assets.logoDark;
  const arrowsBase64 = brand.assets.arrowsFooter;

  const sectionKey =
    service.sectionId ?? SECTION_KEYS.serviceKey(service.sectionNumber);

  const showBom =
    service.layout === 'itemized-with-price' || service.layout === 'itemized-without-price';
  const items = service.bomItems || [];
  const hasBom = showBom && items.length > 0;
  const bomLayout = service.layout as 'itemized-with-price' | 'itemized-without-price';
  const hasOtherCosts = service.laborCategories && service.laborCategories.length > 0;

  const pages: React.ReactNode[] = [];

  pages.push(
    <Shell
      key="overview"
      pageHeader={pageHeader}
      logoBase64={logoBase64}
      arrowsBase64={arrowsBase64}
    >
      <FlowMarker sectionKey={sectionKey} position="start" />
      <Text style={styles.projectTitle}>{service.projectTitle}</Text>
      {service.showProjectIntro && service.projectIntro && (
        <Text style={styles.projectIntro}>{service.projectIntro}</Text>
      )}
      <SectionHeaderRow
        sectionNumber={service.sectionNumber}
        sectionName={service.sectionName}
      />
      {service.description ? (
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontSize: 12,
            lineHeight: 1.4,
            color: brand.colors.gray,
            marginBottom: 16,
          }}
        >
          {service.description}
        </Text>
      ) : null}
      {!hasBom && !hasOtherCosts && service.layout !== 'zero-ventilation' && (
        <>
          <TotalRow amount={service.totalCost} />
          <InlineTaxDisclaimer />
          <FlowMarker sectionKey={sectionKey} position="end" />
        </>
      )}
    </Shell>
  );

  if (service.layout === 'zero-ventilation') {
    pages.push(
      <Shell
        key="zero-vent"
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
      >
        <Text style={styles.projectTitle}>{service.projectTitle}</Text>
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
        <TotalRow amount={service.totalCost} />
        <InlineTaxDisclaimer />
        <FlowMarker sectionKey={sectionKey} position="end" />
      </Shell>
    );
  }

  if (hasBom) {
    pages.push(
      <Shell
        key="bom"
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
        bottomReserve={24}
      >
        <View fixed>
          <Text style={styles.projectTitle}>{service.projectTitle}</Text>
          <SectionHeaderRow
            sectionNumber={service.sectionNumber}
            sectionName={service.sectionName}
          />
          <BomCardTop sectionName={service.sectionName} layout={bomLayout} lang={lang} />
        </View>
        <BomDataRows
          items={items}
          subtotal={service.bomSubtotal}
          layout={bomLayout}
          lang={lang}
          selectedLang={selectedLang}
        />
        {!hasOtherCosts && (
          <>
            <TotalRow amount={service.totalCost} />
            <InlineTaxDisclaimer />
          </>
        )}
        <FlowMarker sectionKey={sectionKey} position="end" />
      </Shell>
    );
  }

  if (hasOtherCosts) {
    pages.push(
      <Shell
        key="costs"
        pageHeader={pageHeader}
        logoBase64={logoBase64}
        arrowsBase64={arrowsBase64}
      >
        <Text style={styles.projectTitle}>{service.projectTitle}</Text>
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
        <TotalRow amount={service.totalCost} />
        <InlineTaxDisclaimer />
        <FlowMarker sectionKey={sectionKey} position="end" />
      </Shell>
    );
  }

  return <>{pages}</>;
};
