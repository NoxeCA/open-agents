import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { FC } from 'react';
import type { QuoteTranslations } from '@/lib/locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import { QuoteEditableRegion } from '../../components/editable-region';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { partnersStyles as styles } from './styles';

interface PartnersPageProps {
  data?: unknown;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const PartnersPage: FC<PartnersPageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  pageNumbers,
}) => {
  const categories = lang.partners.categories;

  return (
    <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.partners} position="start" />

      <Text style={styles.title}>{lang.partners.title}</Text>
      <Text style={styles.intro}>{lang.partners.intro}</Text>

      <QuoteEditableRegion
        root={data}
        section="partners"
        anchor="afterIntro"
        anchorAliases={["after-intro"]}
        regionIds={["partners:after-intro"]}
        style={{ marginBottom: 16 }}
      />

      {categories.map((category: { name: string; partners: string[] }, catIdx: number) => (
        <React.Fragment key={catIdx}>
          <View style={styles.separator} />

          <Text style={styles.categoryHeading}>{category.name}</Text>

          <View style={styles.partnersRow}>
            {category.partners.map((partner: string, i: number) => (
              <View key={i} style={styles.partnerItem}>
                <Text style={styles.partnerText}>{partner}</Text>
                {i < category.partners.length - 1 && (
                  <View style={styles.partnerDot} />
                )}
              </View>
            ))}
          </View>
        </React.Fragment>
      ))}

      {categories.length > 0 && <View style={styles.separator} />}

      <QuoteEditableRegion
        root={data}
        section="partners"
        anchor="body"
        regionIds={["partners:body"]}
        style={{ marginTop: 16 }}
      />

      <QuoteEditableRegion
        root={data}
        section="partners"
        anchor="footer"
        regionIds={["partners:footer"]}
        style={{ marginTop: 16 }}
      />

      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.partners} position="end" />
    </PageShell>
  );
};

export default PartnersPage;
