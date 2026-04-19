import React, { FC } from 'react';
import { Image, Text, View } from '@react-pdf/renderer';
import { formatDateLong } from '@/lib/documents/quote/shared/formatters';
import { coverStyles as styles } from '@/lib/documents/quote/pages/01-cover/styles';
import { useBrand } from '../../brand';
import type { CoverBlockProps } from '../../catalog/composites/CoverBlock';

// Shorten long names by abbreviating from the last name backward.
// Ported verbatim from lib/documents/quote/pages/01-cover/CoverPage.tsx.
const shortenName = (name: string, maxLen: number): string => {
  if (name.length <= maxLen) return name;
  const parts = name.split(/\s+/);
  if (parts.length <= 1) return name;
  const segments: { groupIdx: number; segIdx: number; text: string }[] = [];
  parts.forEach((part, gi) => {
    part.split('-').forEach((seg, si) => {
      segments.push({ groupIdx: gi, segIdx: si, text: seg });
    });
  });
  for (let i = segments.length - 1; i >= 1; i--) {
    segments[i].text = segments[i].text[0] + '.';
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
  segments.forEach(s => groups[s.groupIdx].push(s.text));
  return groups.map(g => g.join('-')).join(' ');
};

export const CoverBlockRenderer: FC<CoverBlockProps> = props => {
  const brand = useBrand();
  const lang = brand.translations;
  const selectedLang = brand.lang;
  const logoBase64 = brand.assets.logoDark;
  const hexPatternBase64 = brand.assets.hexPatternTopRight;

  return (
    <>
      {/* Client logo — top left */}
      {props.clientLogo && (
        <View style={styles.clientLogoArea}>
          <Image style={styles.clientLogo} src={props.clientLogo} />
          {props.clientName && <Text style={styles.clientName}>{props.clientName}</Text>}
        </View>
      )}
      {!props.clientLogo && props.clientName && (
        <View style={styles.clientLogoArea}>
          <Text style={styles.clientName}>{props.clientName}</Text>
        </View>
      )}

      {/* Hex pattern — top right */}
      {hexPatternBase64 && <Image style={styles.hexPattern} src={hexPatternBase64} />}

      {/* Bottom section: title + info grid */}
      <View style={styles.bottomSection}>
        <View style={styles.titleArea}>
          <Text style={styles.subtitle}>{props.subtitle}</Text>
          <Text style={styles.documentType}>{props.documentType}</Text>
          <Text style={styles.documentTitle}>{props.documentTitle}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoRow, styles.infoRow1]}>
            <View style={[styles.infoCol, styles.infoColFirst]}>
              <Text style={styles.infoLabel}>{lang.common.quoteNumber}</Text>
              <Text style={styles.infoValue}>
                {props.quoteID} / Revision {props.revision}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>{lang.common.quoteDate}</Text>
              <Text style={styles.infoValue}>{formatDateLong(props.quoteDate, selectedLang)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>{lang.common.validUntil}</Text>
              <Text style={styles.infoValue}>
                {formatDateLong(props.validUntil, selectedLang)}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, styles.infoRow2]}>
            <View style={styles.noxeLogoContainer}>
              {logoBase64 && <Image style={styles.noxeLogo} src={logoBase64} />}
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>{lang.common.preparedFor}</Text>
              {props.preparedFor.map((person, i) => (
                <Text key={i} style={styles.infoValue}>
                  {shortenName(person.name, 22)}
                </Text>
              ))}
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>{lang.common.preparedBy}</Text>
              {props.preparedBy.map((person, i) => (
                <Text key={i} style={styles.infoValue}>
                  {shortenName(person.name, 22)}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    </>
  );
};
