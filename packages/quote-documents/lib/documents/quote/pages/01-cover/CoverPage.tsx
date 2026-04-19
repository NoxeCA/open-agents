import React from 'react';
import { Image, Page, Text, View } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteData } from '../../types';
import type { QuoteTranslations, Language } from '../../../../locales/loader';
import { formatDateLong } from '../../shared/formatters';
import { coverStyles as styles } from './styles';

// Shorten long names by abbreviating from the last name backward.
// For hyphenated parts, abbreviate the last hyphen segment first:
// "Olivia Bennett-Richardson" → "Olivia Bennett-R." → "Olivia B."
const shortenName = (name: string, maxLen: number): string => {
  if (name.length <= maxLen) return name;
  const parts = name.split(/\s+/);
  if (parts.length <= 1) return name;

  // Each part can have hyphen segments: ["Olivia", "Bennett-Richardson"]
  // We flatten to a list of abbreviatable segments with their group index
  const segments: { groupIdx: number; segIdx: number; text: string }[] = [];
  parts.forEach((part, gi) => {
    part.split('-').forEach((seg, si) => {
      segments.push({ groupIdx: gi, segIdx: si, text: seg });
    });
  });

  // Abbreviate segments from the end backward, skipping the first name (group 0, seg 0)
  for (let i = segments.length - 1; i >= 1; i--) {
    const segment = segments[i];
    if (!segment) continue;
    const abbreviated = segment.text.charAt(0);
    if (!abbreviated) continue;
    segment.text = `${abbreviated}.`;
    // Rebuild the name
    const result = rebuildName(parts, segments);
    if (result.length <= maxLen) return result;
  }
  return rebuildName(parts, segments);
};

const rebuildName = (
  parts: string[],
  segments: { groupIdx: number; segIdx: number; text: string }[]
): string => {
  const groups: string[][] = parts.map(() => []);
  segments.forEach((segment) => {
    const group = groups[segment.groupIdx];
    if (!group) return;
    group.push(segment.text);
  });
  return groups.map(g => g.join('-')).join(' ');
};

interface CoverPageProps {
  data: QuoteData;
  logoBase64: string;
  hexPatternBase64: string;
  lang: QuoteTranslations;
  selectedLang: Language;
}

const CoverPage: FC<CoverPageProps> = ({ data, logoBase64, hexPatternBase64, lang, selectedLang }) => {
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Client Logo - top left */}
      {data.clientLogo && (
        <View style={styles.clientLogoArea}>
          <Image style={styles.clientLogo} src={data.clientLogo} />
          {data.clientName && (
            <Text style={styles.clientName}>{data.clientName}</Text>
          )}
        </View>
      )}
      {!data.clientLogo && data.clientName && (
        <View style={styles.clientLogoArea}>
          <Text style={styles.clientName}>{data.clientName}</Text>
        </View>
      )}

      {/* Hexagonal pattern - top right */}
      {hexPatternBase64 && (
        <Image style={styles.hexPattern} src={hexPatternBase64} />
      )}

      {/* Bottom section: title + 144px gap + info grid */}
      <View style={styles.bottomSection}>
        {/* Title area */}
        <View style={styles.titleArea}>
          <Text style={styles.subtitle}>{data.subtitle}</Text>
          <Text style={styles.documentType}>{data.documentType}</Text>
          <Text style={styles.documentTitle}>{data.documentTitle}</Text>
        </View>

        {/* Info Grid: 3 cols x 2 rows */}
        <View style={styles.infoGrid}>
        {/* Row 1: Quote #, Quote date, Valid until */}
        <View style={[styles.infoRow, styles.infoRow1]}>
          <View style={[styles.infoCol, styles.infoColFirst]}>
            <Text style={styles.infoLabel}>{lang.common.quoteNumber}</Text>
            <Text style={styles.infoValue}>
              {data.quoteID} / Revision {data.revision}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{lang.common.quoteDate}</Text>
            <Text style={styles.infoValue}>
              {formatDateLong(data.quoteDate, selectedLang)}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{lang.common.validUntil}</Text>
            <Text style={styles.infoValue}>
              {formatDateLong(data.validUntil, selectedLang)}
            </Text>
          </View>
        </View>

        {/* Row 2: Noxe logo, Prepared for, Prepared by */}
        <View style={[styles.infoRow, styles.infoRow2]}>
          <View style={styles.noxeLogoContainer}>
            {logoBase64 && (
              <Image style={styles.noxeLogo} src={logoBase64} />
            )}
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{lang.common.preparedFor}</Text>
            {data.preparedFor.map((person, i) => (
              <Text key={i} style={styles.infoValue}>{shortenName(person.name, 22)}</Text>
            ))}
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>{lang.common.preparedBy}</Text>
            {data.preparedBy.map((person, i) => (
              <Text key={i} style={styles.infoValue}>{shortenName(person.name, 22)}</Text>
            ))}
          </View>
        </View>
      </View>
      </View>
    </Page>
  );
};

export default CoverPage;
