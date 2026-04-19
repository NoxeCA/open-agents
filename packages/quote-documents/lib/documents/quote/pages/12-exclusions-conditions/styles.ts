import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const exclusionsConditionsStyles = StyleSheet.create({
  sectionHeading: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.35,
    color: colors.dark,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },

  bullet: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
    width: 15,
  },

  bulletText: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
    textAlign: 'justify',
    flex: 1,
  },

  sectionGap: {
    marginBottom: 16,
  },

  warrantyText: {
    fontWeight: 400,
    fontSize: 12,
    lineHeight: 1.17,
    color: colors.gray,
    textAlign: 'justify',
    marginTop: 0,
    marginBottom: 60,
  },

  warrantyLabel: {
    fontWeight: 700,
    color: colors.dark,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  infoIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
    marginTop: 1,
  },

  infoText: {
    fontWeight: 400,
    fontSize: 12,
    lineHeight: 1.17,
    color: colors.gray,
    flex: 1,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  contactBlock: {
    width: 250,
  },

  contactName: {
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.dark,
  },

  contactCompany: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
  },

  contactPhone: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
  },

  contactEmail: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.dark,
    textDecoration: 'underline',
  },

  signatureBlock: {
    width: 290,
    justifyContent: 'flex-end',
  },

  signatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },

  signatureLabel: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
    flex: 1,
    marginRight: 8,
    textAlign: 'right',
  },

  signatureLine: {
    width: 138,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
