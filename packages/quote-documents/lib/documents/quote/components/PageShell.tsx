import React from 'react';
import { Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { colors } from '@/lib/documents/shared/constants';
import { basePageStyle, spacing } from '../shared/styles';

const styles = StyleSheet.create({
  page: {
    ...basePageStyle,
    padding: spacing.pagePadding,
    flexDirection: 'column',
  },
  pageHeader: {
    fontFamily: 'URWGeometric',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 33,
  },
  footerLogo: {
    width: 64,
    height: 17,
  },
  footerArrows: {
    position: 'absolute',
    right: 30,
    bottom: -10,
    width: 18,
    height: 18,
  },
});

interface PageShellProps {
  children: React.ReactNode;
  pageHeader?: string;
  logoBase64?: string;
  arrowsBase64?: string;
  arrowsFlipped?: boolean;
  bottomReserve?: number;
}

const PageShell: React.FC<PageShellProps> = ({ children, pageHeader, logoBase64, arrowsBase64, arrowsFlipped, bottomReserve }) => (
  <Page size="LETTER" style={styles.page}>
    {pageHeader && (
      <Text style={styles.pageHeader} fixed>{pageHeader}</Text>
    )}

    <View style={bottomReserve ? { ...styles.content, paddingBottom: bottomReserve } : styles.content}>
      {children}
    </View>

    <View style={styles.footer} fixed>
      {logoBase64 ? (
        <Image style={styles.footerLogo} src={logoBase64} />
      ) : (
        <View />
      )}
      {arrowsBase64 && (
        <Image style={arrowsFlipped ? { ...styles.footerArrows, transform: 'scaleY(-1)', bottom: -8 } : styles.footerArrows} src={arrowsBase64} />
      )}
    </View>
  </Page>
);

export default PageShell;
