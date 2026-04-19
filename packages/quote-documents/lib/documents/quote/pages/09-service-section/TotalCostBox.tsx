import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations, Language } from '../../../../locales/loader';
import { formatCurrency } from '../../shared/formatters';
import { serviceSectionStyles as styles } from './styles';

interface TotalCostBoxProps {
  totalCost: number;
  lang: QuoteTranslations;
  selectedLang: Language;
}

const TotalCostBox: FC<TotalCostBoxProps> = ({ totalCost, lang, selectedLang }) => (
  <View style={styles.totalCostBox} wrap={false}>
    <View style={styles.totalCostAccent} />
    <Text style={styles.totalCostLabel}>{lang.common.totalCost}</Text>
    <Text style={styles.totalCostAmount}>{formatCurrency(totalCost, selectedLang)}</Text>
  </View>
);

export default TotalCostBox;
