import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations, Language } from '../../../../locales/loader';
import type { LaborItem } from './types';
import { formatCurrency } from '../../shared/formatters';
import { serviceSectionStyles as styles } from './styles';

interface ZeroVentilationTableProps {
  sectionName: string;
  bomSubtotal?: number;
  laborCategories?: LaborItem[];
  totalCost: number;
  lang: QuoteTranslations;
  selectedLang: Language;
}

const ZeroVentilationTable: FC<ZeroVentilationTableProps> = ({
  sectionName,
  bomSubtotal,
  laborCategories,
  totalCost,
  lang,
  selectedLang,
}) => {
  const description = lang.service.zeroVentilationDescription.replace(
    '{section}',
    sectionName.toLowerCase(),
  );

  // Build rows: MATERIALS (if bomSubtotal exists) + labor categories
  const rows: { label: string; amount: number }[] = [];

  if (bomSubtotal !== undefined && bomSubtotal > 0) {
    rows.push({ label: lang.service.materialsLabel, amount: bomSubtotal });
  }

  if (laborCategories) {
    laborCategories.forEach((item) => {
      rows.push({ label: item.category, amount: item.amount });
    });
  }

  return (
    <View style={styles.zeroVentCard} wrap={false}>
      {/* Title + Description (reuse BOM title block styles) */}
      <View style={styles.bomTitleBlock}>
        <Text style={styles.bomTitle}>{lang.service.zeroVentilationTitle}</Text>
      </View>
      <Text style={styles.bomDescription}>{description}</Text>

      {/* First divider */}
      <View style={styles.otherCostsDivider} />

      {/* Cost rows (reuse Other Costs row styles) */}
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          <View style={styles.otherCostsRow} wrap={false}>
            <Text style={styles.otherCostsLabel}>{row.label}</Text>
            <View style={styles.otherCostsVerticalDivider} />
            <Text style={styles.otherCostsAmount}>
              {formatCurrency(row.amount, selectedLang)}
            </Text>
          </View>
          {i < rows.length - 1 && <View style={styles.otherCostsDivider} />}
        </React.Fragment>
      ))}

      {/* Subtotal */}
      <View style={styles.subtotalRowInCard} wrap={false}>
        <Text style={styles.subtotalLabel}>{lang.service.subtotal}</Text>
        <Text style={styles.subtotalAmount}>
          {formatCurrency(totalCost, selectedLang)}
        </Text>
      </View>
    </View>
  );
};

export default ZeroVentilationTable;
