import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import { FC } from 'react';
import type { QuoteTranslations } from '@/lib/locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import { QuoteEditableRegion } from '../../components/editable-region';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { aboutUsStyles as styles } from './styles';


interface AboutUsPageProps {
  data?: unknown;
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
  data,
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

    <QuoteEditableRegion
      root={data}
      section="about-us"
      anchor="afterIntro"
      anchorAliases={["after-intro"]}
      regionIds={["about-us:after-intro"]}
      style={{ marginBottom: 16 }}
    />

    <Text style={styles.sectionHeading}>{lang.aboutUs.whoAreWe}</Text>
    <Text style={styles.sectionText}>{lang.aboutUs.whoAreWeText}</Text>

    <Text style={styles.sectionHeading}>{lang.aboutUs.howDoWeWork}</Text>
    <Text style={styles.sectionText}>{lang.aboutUs.howDoWeWorkText}</Text>

    <QuoteEditableRegion
      root={data}
      section="about-us"
      anchor="body"
      regionIds={["about-us:body"]}
      style={{ marginBottom: 16 }}
    />

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

    <QuoteEditableRegion
      root={data}
      section="about-us"
      anchor="footer"
      regionIds={["about-us:footer"]}
      style={{ marginTop: 16 }}
    />

    <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.aboutUs} position="end" />
  </PageShell>
);

export default AboutUsPage;
