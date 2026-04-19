import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { FC } from 'react';
import type { QuoteTranslations, Language } from '@/lib/locales/loader';
import type { LaborItem } from './types';
import { formatCurrency } from '../../shared/formatters';
import { serviceSectionStyles as styles } from './styles';

interface OtherCostsTableProps {
  items: LaborItem[];
  subtotal?: number;
  sectionName: string;
  lang: QuoteTranslations;
  selectedLang: Language;
}

const OtherCostsTable: FC<OtherCostsTableProps> = ({
  items,
  subtotal,
  sectionName,
  lang,
  selectedLang,
}) => {
  const description = lang.service.otherServicesDescription.replace(
    '{section}',
    sectionName.toLowerCase(),
  );

  return (
    <View style={styles.otherCostsCard} wrap={false}>
      {/* Title + Description */}
      <View style={styles.bomTitleBlock}>
        <Text style={styles.bomTitle}>{lang.service.laborAndServices}</Text>
      </View>
      <Text style={[styles.bomDescription, { paddingBottom: 4 }]}>{description}</Text>
      <View style={styles.otherCostsDivider} />

      {/* Cost item rows */}
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <View style={styles.otherCostsRow} wrap={false}>
            <Text style={styles.otherCostsLabel}>{item.category}</Text>
            <View style={styles.otherCostsVerticalDivider} />
            <Text style={styles.otherCostsAmount}>
              {formatCurrency(item.amount, selectedLang)}
            </Text>
          </View>
          {i < items.length - 1 && <View style={styles.otherCostsDivider} />}
        </React.Fragment>
      ))}

      {/* Subtotal */}
      {subtotal !== undefined && (
        <View style={styles.subtotalRowInCard} wrap={false}>
          <Text style={styles.subtotalLabel}>{lang.service.subtotal}</Text>
          <Text style={styles.subtotalAmount}>
            {formatCurrency(subtotal, selectedLang)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default OtherCostsTable;
