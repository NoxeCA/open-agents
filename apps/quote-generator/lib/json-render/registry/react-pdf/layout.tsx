import React, { FC, ReactNode } from 'react';
import { View } from '@react-pdf/renderer';
import { useBrand } from '../../brand';
import type {
  hstackProps,
  vstackProps,
  sectionProps,
  spacerProps,
  dividerProps,
  boxProps,
} from '../../catalog/layout/primitives';
import type { z } from 'zod';

type HStackProps = z.infer<typeof hstackProps> & { children: ReactNode };
type VStackProps = z.infer<typeof vstackProps> & { children: ReactNode };
type SectionProps = z.infer<typeof sectionProps> & { children: ReactNode };
type SpacerProps = z.infer<typeof spacerProps>;
type DividerProps = z.infer<typeof dividerProps>;
type BoxProps = z.infer<typeof boxProps> & { children: ReactNode };

const alignMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
};

export const HStackRenderer: FC<HStackProps> = ({ gap, align, wrap, children }) => (
  <View
    style={{
      flexDirection: 'row',
      gap: gap ?? 0,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      alignItems: align && ['start', 'center', 'end'].includes(align) ? alignMap[align] : undefined,
      justifyContent: align && ['space-between', 'space-around'].includes(align) ? alignMap[align] : undefined,
    } as any}
  >
    {children}
  </View>
);

export const VStackRenderer: FC<VStackProps> = ({ gap, align, children }) => (
  <View
    style={{
      flexDirection: 'column',
      gap: gap ?? 0,
      alignItems: align ? alignMap[align] : undefined,
    } as any}
  >
    {children}
  </View>
);

export const SectionRenderer: FC<SectionProps> = ({ gap, children }) => (
  <View style={{ flexDirection: 'column', gap: gap ?? 16 } as any}>{children}</View>
);

export const SpacerRenderer: FC<SpacerProps> = ({ height, width }) => {
  if (height == null && width == null) {
    return <View style={{ flex: 1 }} />;
  }
  return <View style={{ height, width }} />;
};

export const DividerRenderer: FC<DividerProps> = ({ color, thickness, vertical }) => {
  const brand = useBrand();
  const c = color ?? brand.colors.borderLight;
  if (vertical) {
    return <View style={{ width: thickness ?? 1, alignSelf: 'stretch', backgroundColor: c }} />;
  }
  return <View style={{ height: thickness ?? 1, backgroundColor: c }} />;
};

export const BoxRenderer: FC<BoxProps> = ({
  padding,
  paddingX,
  paddingY,
  background,
  border,
  radius,
  flex,
  children,
}) => (
  <View
    style={{
      padding,
      paddingHorizontal: paddingX,
      paddingVertical: paddingY,
      backgroundColor: background,
      borderWidth: border ? 1 : undefined,
      borderColor: border,
      borderRadius: radius,
      flex,
    }}
  >
    {children}
  </View>
);
