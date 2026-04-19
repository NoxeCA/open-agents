import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';
import { basePageStyle, spacing } from '../../shared/styles';

export const coverStyles = StyleSheet.create({
  page: {
    ...basePageStyle,
  },

  // Client logo area - top left
  clientLogoArea: {
    position: 'absolute',
    left: spacing.pagePadding,
    top: spacing.pagePadding,
  },
  clientLogo: {
    width: 53,
    height: 35,
  },
  clientName: {
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1,
    color: colors.dark,
    marginTop: 5,
    maxWidth: 200,
  },

  // Hexagonal pattern - top right
  hexPattern: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 412,
    height: 402,
  },

  // Bottom section — title + info grid anchored to bottom
  bottomSection: {
    position: 'absolute',
    left: spacing.pagePadding,
    right: spacing.pagePadding,
    bottom: spacing.pagePadding,
  },

  // Title area — 144px margin below before info grid
  titleArea: {
    marginBottom: 144,
  },
  subtitle: {
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1.33,
    color: colors.gray,
    marginBottom: 0,
    maxWidth: 300,
  },
  documentType: {
    fontWeight: 700,
    fontSize: 56,
    lineHeight: 1,
    color: colors.dark,
    marginTop: -2,
    marginLeft: -3,
  },
  documentTitle: {
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1,
    color: colors.grayMedium,
    marginTop: 16,
    maxWidth: 300,
  },

  // Info tables - two 3-col tables with 40px gap
  infoGrid: {},
  infoRow: {
    flexDirection: 'row',
  },
  infoRow1: {
    height: 60,
    marginBottom: 40,
  },
  infoRow2: {},
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 32,
  },
  infoColFirst: {
    paddingLeft: 0,
  },
  infoDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoLabel: {
    fontWeight: 400,
    fontSize: 12,
    lineHeight: 1.33,
    color: colors.grayMedium,
    marginBottom: 6,
    textAlign: 'left',
  },
  infoValue: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.dark,
    textAlign: 'left',
  },

  // Noxe logo in bottom row
  noxeLogo: {
    width: 90,
    height: 24,
  },
  noxeLogoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 0,
  },
});
