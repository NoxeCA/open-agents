import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '@/lib/documents/shared/constants';

export const termsAndConditionsStyles = StyleSheet.create({
  title: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  sectionHeading: {
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1.375,
    color: colors.dark,
    marginBottom: 8,
  },

  sectionText: {
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.2,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 12,
  },

  sectionTextLast: {
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.2,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 0,
  },
});
