import React from 'react';
import { Text, Image } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import type { OptionalPageData } from './types';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { optionalPageStyles as styles } from './styles';

interface OptionalPagesProps {
  pages: OptionalPageData[];
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  hexPatternBase64: string;
  pageNumbers: PageNumberCollector;
}

const OptionalPages: FC<OptionalPagesProps> = ({
  pages,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  hexPatternBase64,
  pageNumbers,
}) => (
  <>
    {pages.map((page, i) => (
      <PageShell key={i} pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
        <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.optionalKey(i)} position="start" />

        {hexPatternBase64 && (
          <Image style={styles.hexPattern} src={hexPatternBase64} />
        )}

        <Text style={styles.pageTitle}>{page.pageTitle}</Text>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.text}>{page.text}</Text>

        <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.optionalKey(i)} position="end" />
      </PageShell>
    ))}
  </>
);

export default OptionalPages;
