import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { FC } from 'react';
import type { QuoteTranslations } from '@/lib/locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import { QuoteEditableRegion } from '../../components/editable-region';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { cultureStyles as styles } from './styles';

interface CulturePageProps {
  data?: unknown;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const CulturePage: FC<CulturePageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  pageNumbers,
}) => (
  <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
    <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.culture} position="start" />

    <Text style={styles.title}>{lang.culture.title}</Text>

    <QuoteEditableRegion
      root={data}
      section="culture"
      anchor="afterIntro"
      anchorAliases={["after-intro"]}
      regionIds={["culture:after-intro"]}
      style={{ marginBottom: 16 }}
    />

    <View style={styles.columnsContainer}>
      <View style={styles.leftColumn}>
        <Text style={styles.sectionHeading}>{lang.culture.ourCompany}</Text>
        <Text style={styles.sectionText}>{lang.culture.ourCompanyText}</Text>

        <Text style={styles.sectionHeading}>{lang.culture.ourValues}</Text>
        <Text style={styles.sectionText}>{lang.culture.ourValuesText}</Text>
      </View>

      <View style={styles.rightColumn}>
        <Text style={styles.sectionHeading}>{lang.culture.ourMission}</Text>
        <Text style={styles.sectionText}>{lang.culture.ourMissionText}</Text>

        <Text style={styles.sectionHeading}>{lang.culture.ourVision}</Text>
        <Text style={styles.sectionText}>{lang.culture.ourVisionText}</Text>
      </View>
    </View>

    <QuoteEditableRegion
      root={data}
      section="culture"
      anchor="body"
      regionIds={["culture:body"]}
      style={{ marginTop: 16 }}
    />

    <QuoteEditableRegion
      root={data}
      section="culture"
      anchor="footer"
      regionIds={["culture:footer"]}
      style={{ marginTop: 16 }}
    />

    <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.culture} position="end" />
  </PageShell>
);

export default CulturePage;
