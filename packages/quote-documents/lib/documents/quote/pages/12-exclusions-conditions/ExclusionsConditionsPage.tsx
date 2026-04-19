import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import type { ExclusionsConditionsPageData } from './types';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { exclusionsConditionsStyles as styles } from './styles';

const BulletList: FC<{ items: string[] }> = ({ items }) => (
  <View style={styles.sectionGap}>
    {items.map((item, i) => (
      <View key={i} style={styles.bulletItem}>
        <Text style={styles.bullet}>{'\u2022'}</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

function normalizeItems(items: string[]) {
  return items.map((item) => item.trim()).filter((item) => item.length > 0);
}


interface ExclusionsConditionsPageProps {
  data: ExclusionsConditionsPageData;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  infoIconBase64: string;
  pageNumbers: PageNumberCollector;
}

const ExclusionsConditionsPage: FC<ExclusionsConditionsPageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  infoIconBase64,
  pageNumbers,
}) => (
  <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
    <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.exclusionsConditions} position="start" />

    {(() => {
      const exclusions = normalizeItems(data.exclusions);
      const specialConditions = normalizeItems(data.specialConditions);
      const notes = normalizeItems(data.notes);
      const paymentTerms = normalizeItems(data.paymentTerms);

      return (
        <>
          {/* Exclusion(s) */}
          {exclusions.length > 0 && (
            <>
              <Text style={styles.sectionHeading}>
                {exclusions.length > 1 ? lang.exclusions.exclusionTitlePlural : lang.exclusions.exclusionTitle}
              </Text>
              <BulletList items={exclusions} />
            </>
          )}

          {/* Special Condition(s) */}
          {specialConditions.length > 0 && (
            <>
              <Text style={styles.sectionHeading}>
                {specialConditions.length > 1
                  ? lang.exclusions.specialConditionsTitlePlural
                  : lang.exclusions.specialConditionsTitle}
              </Text>
              <BulletList items={specialConditions} />
            </>
          )}

          {/* Note(s) */}
          {notes.length > 0 && (
            <>
              <Text style={styles.sectionHeading}>
                {notes.length > 1 ? lang.exclusions.noteTitlePlural : lang.exclusions.noteTitle}
              </Text>
              <BulletList items={notes} />
            </>
          )}

          {/* Payment Term(s) */}
          {paymentTerms.length > 0 && (
            <>
              <Text style={styles.sectionHeading}>
                {paymentTerms.length > 1
                  ? lang.exclusions.paymentTermTitlePlural
                  : lang.exclusions.paymentTermTitle}
              </Text>
              <BulletList items={paymentTerms} />
            </>
          )}
        </>
      );
    })()}

    {/* Warranty — label is bold dark, text is regular gray */}
    <Text style={styles.warrantyText}>
      <Text style={styles.warrantyLabel}>{lang.exclusions.warrantyLabel} </Text>
      {lang.exclusions.warrantyText}
    </Text>

    {/* Info line */}
    <View style={styles.infoRow}>
      {infoIconBase64 && <Image style={styles.infoIcon} src={infoIconBase64} />}
      <Text style={styles.infoText}>{lang.exclusions.infoText}</Text>
    </View>

    {/* Contact + Signature block */}
    <View style={styles.bottomRow}>
      <View style={styles.contactBlock}>
        <Text style={styles.contactName}>{data.contactInfo.name}</Text>
        <Text style={styles.contactCompany}>Noxe Inc</Text>
        <Text style={styles.contactPhone}>Phone: {data.contactInfo.phone}</Text>
        <Text style={styles.contactEmail}>{data.contactInfo.email}</Text>
      </View>

      <View style={styles.signatureBlock}>
        <View style={styles.signatureRow}>
          <Text style={styles.signatureLabel}>{lang.exclusions.clientSignature}</Text>
          <View style={styles.signatureLine} />
        </View>
        <View style={styles.signatureRow}>
          <Text style={styles.signatureLabel}>{lang.exclusions.date}</Text>
          <View style={styles.signatureLine} />
        </View>
      </View>
    </View>

    <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.exclusionsConditions} position="end" />
  </PageShell>
);

export default ExclusionsConditionsPage;
