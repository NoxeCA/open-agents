import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

export const ceoMessageStyles = StyleSheet.create({
  // Hex pattern - absolute top-right, same as cover page
  hexPattern: {
    position: 'absolute',
    right: -32,
    top: -72,
    width: 412,
    height: 402,
  },

  // Page title - "MESSAGE FROM OUR CEO"
  title: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    marginBottom: 24,
  },

  // Main content area between title and values row
  // flex-end pushes content toward the bottom (grows upward when text is long)
  contentArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // CEO title label - "THE COMPANY CEO"
  ceoTitle: {
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1.33,
    color: colors.gray,
    letterSpacing: 1,
    marginBottom: 4,
  },

  // CEO name
  ceoName: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.35,
    color: colors.dark,
    marginBottom: 16,
  },

  // Message text paragraphs
  messageText: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 0,
  },

  // Values row at bottom — 3-column table with 1 row
  valuesRow: {
    flexDirection: 'row',
    marginTop: 80,
  },

  // Each cell: left border, arrow on the border, word centered
  valueCell: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: 24,
  },

  // Arrow sits on the left border of the cell
  valueArrow: {
    position: 'absolute',
    left: -15,
    width: 50,
    height: 50,
  },

  valueText: {
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.grayMedium,
  },
});
