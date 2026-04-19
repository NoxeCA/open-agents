import React from 'react';
import { Text } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { termsAndConditionsStyles as styles } from './styles';

interface TermsAndConditionsPageProps {
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const TermsAndConditionsPage: FC<TermsAndConditionsPageProps> = ({
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  pageNumbers,
}) => {
  const sections = lang.terms.sections;

  return (
    <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64} arrowsFlipped>
      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.termsAndConditions} position="start" />

      <Text style={styles.title}>{lang.terms.title}</Text>

      {sections.map((section: { title: string; text: string }, i: number) => (
        <React.Fragment key={i}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          <Text style={i < sections.length - 1 ? styles.sectionText : styles.sectionTextLast}>{section.text}</Text>
        </React.Fragment>
      ))}

      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.termsAndConditions} position="end" />
    </PageShell>
  );
};

export default TermsAndConditionsPage;
