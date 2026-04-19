import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const aboutUsStyles = StyleSheet.create({
  title: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    marginBottom: 12,
  },
  mainDescription: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 24,
  },
  sectionHeading: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.35,
    color: colors.dark,
    marginBottom: 8,
  },
  sectionText: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 24,
  },
  spacer: {
    flex: 1,
  },
  noxeXLogo: {
    width: 33,
    height: 40,
    alignSelf: 'center',
    marginBottom: 55,
  },
  valuesContainer: {
    marginBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  valueText: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.29,
    color: colors.gray,
  },
  valueDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray,
    marginHorizontal: 8,
  },
});
