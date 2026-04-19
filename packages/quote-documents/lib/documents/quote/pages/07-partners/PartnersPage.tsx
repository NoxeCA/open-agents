import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { partnersStyles as styles } from './styles';

interface PartnersPageProps {
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const PartnersPage: FC<PartnersPageProps> = ({
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

      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.partners} position="end" />
    </PageShell>
  );
};

export default PartnersPage;
