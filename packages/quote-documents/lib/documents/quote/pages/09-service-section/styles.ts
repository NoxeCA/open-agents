import { StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../../shared/constants';

// Shared table border color (matches Figma rgba(0,0,0,0.1))
const TABLE_BORDER = '#E5E5E5';

export const serviceSectionStyles = StyleSheet.create({
  // ─── Overview page ────────────────────────────────────────────────────
  projectTitle: {
    fontWeight: 700,
    fontSize: 32,
    lineHeight: 1.375,
    color: colors.dark,
    textTransform: 'uppercase',
    marginBottom: 24,
  },

  projectIntro: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
    marginBottom: 24,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionNumber: {
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1,
    color: colors.gray,
    marginRight: 8,
  },

  sectionName: {
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1,
    color: colors.dark,
    marginRight: 12,
  },


  sectionBody: {
    paddingHorizontal: 24,
  },

  sectionDescription: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    textAlign: 'justify',
    color: colors.gray,
  },

  // ─── BOM Card (natural pagination — pieces with individual borders) ───
  // Top of the card (fixed, repeats on every overflow page): border top + sides + rounded top corners
  bomCardTop: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: TABLE_BORDER,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  // Card title (LISTE DES MATÉRIAUX) — 24px padding top/left/right, sits above description
  bomTitleBlock: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 6,
  },

  bomTitle: {
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.36,
    color: colors.dark,
    textTransform: 'uppercase',
  },

  bomDescription: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.gray,
    paddingHorizontal: 24,
    marginBottom: 12,
  },

  // ─── Table ────────────────────────────────────────────────────────────
  tableHeaderRow: {
    flexDirection: 'row',
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
  },

  tableHeaderText: {
    fontWeight: 700,
    fontSize: 10,
    lineHeight: 1,
    color: colors.gray,
    textTransform: 'uppercase',
  },

  // Short 22px vertical divider inside header cells (centered in 32px row)
  headerDivider: {
    position: 'absolute',
    left: 0,
    top: 5,
    width: 1,
    height: 22,
    backgroundColor: TABLE_BORDER,
  },

  tableRow: {
    flexDirection: 'row',
    minHeight: 38,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: TABLE_BORDER,
    borderLeftColor: TABLE_BORDER,
    borderRightColor: TABLE_BORDER,
    backgroundColor: '#FFFFFF',
  },

  // Applied to the last row when there's no subtotal (rounds the card's bottom corners)
  tableRowLast: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  // Column widths — all share 10px H / 8px V padding for consistent row rhythm
  colQty: {
    width: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  colPart: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
  },
  // Separate columns used only for the itemized-without-price layout
  colPartNumber: {
    width: 130,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
  },
  colDescription: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
  },
  colOem: {
    width: 82,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
  },
  colUnitPrice: {
    width: 92,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
  },
  colTotal: {
    width: 95,
    paddingLeft: 10,
    paddingRight: 24,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
  },

  // Vertical dividers between data row columns (full row height)
  cellBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: TABLE_BORDER,
  },

  // Cell text
  cellText: {
    fontWeight: 400,
    fontSize: 12,
    lineHeight: 1,
    color: colors.dark,
  },

  cellTextRight: {
    fontWeight: 400,
    fontSize: 12,
    lineHeight: 1,
    color: colors.dark,
    textAlign: 'right',
  },

  cellPartDescription: {
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.2,
    color: colors.gray,
    marginTop: 4,
  },

  cellOemText: {
    fontWeight: 400,
    fontSize: 10,
    lineHeight: 1.2,
    color: colors.dark,
  },

  // ─── Subtotal row ─────────────────────────────────────────────────────
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 42,
    paddingRight: 24,
    borderTopWidth: 2,
    borderTopColor: colors.dark,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftColor: TABLE_BORDER,
    borderRightColor: TABLE_BORDER,
    borderBottomColor: TABLE_BORDER,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  // Subtotal inside a single-bordered card (no side/bottom borders needed)
  subtotalRowInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 42,
    paddingRight: 24,
    borderTopWidth: 2,
    borderTopColor: colors.dark,
  },

  subtotalLabel: {
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1,
    color: colors.dark,
    marginRight: 94,
  },

  subtotalAmount: {
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1,
    color: colors.dark,
    textAlign: 'right',
  },

  // ─── Other Costs Card ─────────────────────────────────────────────────
  otherCostsCard: {
    borderWidth: 1,
    borderColor: TABLE_BORDER,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  otherCostsRow: {
    flexDirection: 'row',
    height: 42,
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },

  otherCostsLabel: {
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1.33,
    color: colors.gray,
    textTransform: 'uppercase',
    flex: 1,
  },

  otherCostsAmount: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.dark,
    textAlign: 'right',
    width: 120,
  },

  otherCostsVerticalDivider: {
    position: 'absolute',
    left: 267,
    top: 10,
    width: 1,
    height: 22,
    backgroundColor: TABLE_BORDER,
  },

  otherCostsDivider: {
    height: 1,
    backgroundColor: TABLE_BORDER,
    marginHorizontal: 24,
  },

  // ─── Zero Ventilation (light card, same style as Other Costs) ───────
  zeroVentCard: {
    borderWidth: 1,
    borderColor: TABLE_BORDER,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  // ─── Total Cost Box ───────────────────────────────────────────────────
  totalCostBox: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TABLE_BORDER,
    borderRadius: 4,
    marginTop: 12,
    position: 'relative',
    overflow: 'hidden',
  },

  totalCostAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.dark,
  },

  totalCostLabel: {
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.14,
    color: colors.dark,
    marginLeft: 26,
  },

  totalCostAmount: {
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1,
    color: colors.dark,
    textAlign: 'right',
    flex: 1,
    paddingRight: 24,
  },

  // ─── Tax Disclaimer ───────────────────────────────────────────────────
  taxDisclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },

  taxDisclaimerIcon: {
    width: 14,
    height: 14,
    marginRight: 8,
    marginTop: 2,
  },

  taxDisclaimerText: {
    fontWeight: 400,
    fontSize: 14,
    lineHeight: 1.29,
    color: colors.gray,
    flex: 1,
  },
});
