import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const optionalPageStyles = StyleSheet.create({
  pageTitle: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  title: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.2,
    color: colors.dark,
    marginBottom: 12,
  },

  text: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
  },

  hexPattern: {
    position: 'absolute',
    right: -32,
    bottom: -65,
    width: 412,
    height: 402,
  },
});
