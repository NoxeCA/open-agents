import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '@/lib/documents/shared/constants';

export const cultureStyles = StyleSheet.create({
  title: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    marginBottom: 24,
  },
  columnsContainer: {
    flexDirection: 'row',
  },
  leftColumn: {
    width: 254,
    marginRight: 24,
  },
  rightColumn: {
    width: 253,
    paddingTop: 112,
  },
  sectionHeading: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.35,
    color: colors.dark,
    marginBottom: 12,
  },
  sectionText: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 24,
  },
});
