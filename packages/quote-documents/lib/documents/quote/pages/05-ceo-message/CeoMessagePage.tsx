import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import type { CeoMessagePageData } from './types';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { ceoMessageStyles as styles } from './styles';

const ARROW_IMAGES = ['dark', 'gray', 'lightGray'] as const;

interface CeoMessagePageProps {
  data: CeoMessagePageData;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  hexPatternBase64: string;
  arrowImages: Record<typeof ARROW_IMAGES[number], string>;
  pageNumbers: PageNumberCollector;
}

const CeoMessagePage: FC<CeoMessagePageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  hexPatternBase64,
  arrowImages,
  pageNumbers,
}) => {
  const ceo = data.ceo;
  if (!ceo) return null;

  const values = ceo.values || [];
  const arrowOrder = [arrowImages.dark, arrowImages.gray, arrowImages.lightGray];

  return (
    <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.ceoMessage} position="start" />

      {/* Hex pattern - absolute positioned top-right */}
      {hexPatternBase64 && (
        <Image style={styles.hexPattern} src={hexPatternBase64} />
      )}

      {/* Page title */}
      <Text style={styles.title}>{lang.ceoMessage.title}</Text>

      {/* Flexible content area - grows upward */}
      <View style={styles.contentArea}>
        {/* CEO title label */}
        <Text style={styles.ceoTitle}>{lang.ceoMessage.subtitle}</Text>

        {/* CEO name */}
        <Text style={styles.ceoName}>{lang.ceoMessage.name}</Text>

        {/* Message text - split by double newlines into paragraphs */}
        {ceo.message.split(/\n\n+/).map((paragraph, i) => (
          <Text key={i} style={styles.messageText}>
            {paragraph.trim()}
          </Text>
        ))}
      </View>

      {/* Values row at bottom — 3-column table */}
      {values.length > 0 && (
        <View style={styles.valuesRow}>
          {values.map((value, i) => (
            <View key={i} style={styles.valueCell}>
              {arrowOrder[i % arrowOrder.length] && (
                <Image
                  style={styles.valueArrow}
                  src={arrowOrder[i % arrowOrder.length]}
                />
              )}
              <Text style={styles.valueText}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.ceoMessage} position="end" />
    </PageShell>
  );
};

export default CeoMessagePage;
