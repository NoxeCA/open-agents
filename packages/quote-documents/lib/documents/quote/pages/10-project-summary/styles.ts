import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const projectSummaryStyles = StyleSheet.create({
  pageTitle: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    textTransform: 'uppercase',
    marginBottom: 24,
  },

  projectBlock: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  projectSubtitle: {
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1,
    color: colors.dark,
    marginBottom: 12,
  },

  projectDescription: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
  },
});
