import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const partnersStyles = StyleSheet.create({
  title: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    marginBottom: 12,
  },

  intro: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 36,
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  categoryHeading: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.35,
    color: colors.grayMedium,
    marginTop: 27,
    marginBottom: 16,
  },

  partnersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 18,
  },

  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  partnerText: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.29,
    color: colors.gray,
  },

  partnerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray,
    marginHorizontal: 6,
  },
});
