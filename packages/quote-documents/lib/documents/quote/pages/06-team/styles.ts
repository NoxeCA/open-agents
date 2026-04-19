import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const teamStyles = StyleSheet.create({
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
    marginBottom: 40,
  },

  card: {
    marginBottom: 40,
  },

  role: {
    fontWeight: 700,
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.gray,
  },

  memberName: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.35,
    color: colors.dark,
    marginBottom: 8,
  },

  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },

  skillPill: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
  },

  skillText: {
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.4,
    color: colors.gray,
  },

  description: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
  },
});
