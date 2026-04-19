import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import { FC } from 'react';
import type { QuoteTranslations } from '@/lib/locales/loader';
import { serviceSectionStyles as styles } from './styles';

interface TaxDisclaimerProps {
  lang: QuoteTranslations;
  infoIconBase64: string;
}

const TaxDisclaimer: FC<TaxDisclaimerProps> = ({ lang, infoIconBase64 }) => (
  <View style={styles.taxDisclaimerRow} wrap={false}>
    {infoIconBase64 && <Image style={styles.taxDisclaimerIcon} src={infoIconBase64} />}
    <Text style={styles.taxDisclaimerText}>{lang.common.taxDisclaimer}</Text>
  </View>
);

export default TaxDisclaimer;
