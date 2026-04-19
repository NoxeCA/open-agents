import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const proposalDescriptionStyles = StyleSheet.create({
  title: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    marginBottom: 16,
  },

  addresseeBlock: {
    marginBottom: 12,
  },

  addresseeLine: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
    marginBottom: 2,
  },

  objectHeading: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.35,
    color: colors.dark,
    marginTop: 12,
    marginBottom: 16,
  },

  paragraph: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 16,
  },

});
