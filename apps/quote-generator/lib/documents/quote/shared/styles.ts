import { colors } from '@/lib/documents/shared/constants';

// Base page style — every page inherits this
export const basePageStyle = {
  fontFamily: 'URWGeometric' as const,
  backgroundColor: colors.white,
  position: 'relative' as const,
  width: '100%' as const,
  height: '100%' as const,
};

// Standard spacing values
export const spacing = {
  pagePadding: 32,
  pagePaddingBottom: 24,
  sectionGap: 16,
  itemGap: 8,
} as const;

// Reusable typography presets
export const typography = {
  heading: {
    fontWeight: 700 as const,
    fontSize: 24,
    lineHeight: 1.2,
    color: colors.dark,
  },
  subheading: {
    fontWeight: 700 as const,
    fontSize: 16,
    lineHeight: 1.25,
    color: colors.dark,
  },
  body: {
    fontWeight: 400 as const,
    fontSize: 10,
    lineHeight: 1.4,
    color: colors.dark,
  },
  label: {
    fontWeight: 400 as const,
    fontSize: 12,
    lineHeight: 1.33,
    color: colors.grayMedium,
  },
  small: {
    fontWeight: 400 as const,
    fontSize: 8,
    lineHeight: 1.5,
    color: colors.gray,
  },
};
