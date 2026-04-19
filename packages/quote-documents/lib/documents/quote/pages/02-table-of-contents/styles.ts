import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const tableOfContentsStyles = StyleSheet.create({
  title: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    marginBottom: 24,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  label: {
    fontWeight: 700,
    fontSize: 16,
    color: colors.gray,
  },

  pageNumber: {
    fontWeight: 700,
    fontSize: 18,
    color: colors.gray,
    textAlign: 'right',
    width: 40,
  },
});
