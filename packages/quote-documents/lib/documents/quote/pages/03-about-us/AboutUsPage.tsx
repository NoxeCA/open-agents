import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { aboutUsStyles as styles } from './styles';


interface AboutUsPageProps {
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  noxeXLogoBase64: string;
  pageNumbers: PageNumberCollector;
}

const ValuesRow: FC<{ values: string[] }> = ({ values }) => (
  <>
    {values.map((value, i) => (
      <React.Fragment key={i}>
        <Text style={styles.valueText}>{value}</Text>
        {i < values.length - 1 && <View style={styles.valueDot} />}
      </React.Fragment>
    ))}
  </>
);

const AboutUsPage: FC<AboutUsPageProps> = ({
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  noxeXLogoBase64,
  pageNumbers,
}) => (
  <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
    <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.aboutUs} position="start" />

    <Text style={styles.title}>{lang.aboutUs.title}</Text>
    <Text style={styles.mainDescription}>{lang.aboutUs.mainDescription}</Text>

    <Text style={styles.sectionHeading}>{lang.aboutUs.whoAreWe}</Text>
    <Text style={styles.sectionText}>{lang.aboutUs.whoAreWeText}</Text>

    <Text style={styles.sectionHeading}>{lang.aboutUs.howDoWeWork}</Text>
    <Text style={styles.sectionText}>{lang.aboutUs.howDoWeWorkText}</Text>

    <View style={styles.spacer} />

    {noxeXLogoBase64 && (
      <Image style={styles.noxeXLogo} src={noxeXLogoBase64} />
    )}

    <View style={styles.valuesContainer}>
      <View style={styles.separator} />
      <View style={styles.valuesRow}>
        <ValuesRow values={lang.aboutUs.valuesRow1} />
      </View>
      <View style={styles.separator} />
      <View style={styles.valuesRow}>
        <ValuesRow values={lang.aboutUs.valuesRow2} />
      </View>
      <View style={styles.separator} />
    </View>

    <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.aboutUs} position="end" />
  </PageShell>
);

export default AboutUsPage;
