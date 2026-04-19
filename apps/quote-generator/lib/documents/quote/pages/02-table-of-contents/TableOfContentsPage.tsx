import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { FC } from 'react';
import type { QuoteTranslations } from '@/lib/locales/loader';
import type { QuoteData } from '../../types';
import type { PageNumberCollector } from '../../shared/pagination';
import { SECTION_KEYS, formatPageRange } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import { tableOfContentsStyles as styles } from './styles';

interface TocEntry {
  label: string;
  page: string;
}

function buildTocEntries(
  data: QuoteData,
  lang: QuoteTranslations,
  pn: PageNumberCollector,
): TocEntry[] {
  const entries: TocEntry[] = [];
  const simple = (label: string, key: string) => ({
    label,
    page: formatPageRange(pn[key]),
  });

  if (data.includeAboutUs !== false) {
    entries.push(simple(lang.toc.aboutUs, SECTION_KEYS.aboutUs));
  }

  if (data.includeCulture !== false) {
    entries.push(simple(lang.toc.ourCulture, SECTION_KEYS.culture));
  }

  if (data.includeCeoMessage !== false && data.ceo) {
    entries.push(simple(lang.toc.managementMessage, SECTION_KEYS.ceoMessage));
  }

  if (data.includeTeam !== false && data.team) {
    entries.push(simple(lang.toc.ourTeam, SECTION_KEYS.team));
  }

  if (data.includePartners !== false) {
    entries.push(simple(lang.toc.ourPartners, SECTION_KEYS.partners));
  }

  entries.push(simple(lang.toc.proposalDescription, SECTION_KEYS.proposalDescription));

  if (data.services && data.services.length > 0) {
    const first = pn[SECTION_KEYS.serviceKey(0)];
    const last = pn[SECTION_KEYS.serviceKey(data.services.length - 1)];
    const combined = first
      ? { start: first.start, end: (last || first).end }
      : undefined;
    entries.push({ label: lang.toc.serviceOffering, page: formatPageRange(combined) });
  }

  entries.push(simple(lang.toc.projectSummary, SECTION_KEYS.projectSummary));

  if (data.optionalPages && data.optionalPages.length > 0) {
    data.optionalPages.forEach((optPage, i) => {
      entries.push(
        simple(optPage.pageTitle || optPage.title || `Page ${i + 1}`, SECTION_KEYS.optionalKey(i)),
      );
    });
  }

  entries.push(simple(lang.toc.exclusion, SECTION_KEYS.exclusionsConditions));
  entries.push(simple(lang.toc.specialCondition, SECTION_KEYS.exclusionsConditions));
  entries.push(simple(lang.toc.paymentTerms, SECTION_KEYS.exclusionsConditions));

  if (data.includeTermsAndConditions !== false) {
    entries.push(simple(lang.toc.termsAndConditions, SECTION_KEYS.termsAndConditions));
  }

  return entries;
}

interface TableOfContentsPageProps {
  data: QuoteData;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const TableOfContentsPage: FC<TableOfContentsPageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  pageNumbers,
}) => {
  const entries = buildTocEntries(data, lang, pageNumbers);
  return (
    <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
      <Text style={styles.title}>{lang.toc.title}</Text>
      {entries.map((entry, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{entry.label}</Text>
          <Text style={styles.pageNumber}>{String(entry.page)}</Text>
        </View>
      ))}
    </PageShell>
  );
};

export default TableOfContentsPage;
