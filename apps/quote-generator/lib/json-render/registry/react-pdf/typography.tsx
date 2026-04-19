import React, { FC } from 'react';
import { Text } from '@react-pdf/renderer';
import { typography } from '@/lib/documents/quote/shared/styles';
import { useBrand } from '../../brand';
import type {
  headingProps,
  subheadingProps,
  paragraphProps,
  labelProps,
  captionProps,
} from '../../catalog/typography/primitives';
import type { z } from 'zod';

type HeadingProps = z.infer<typeof headingProps>;
type SubheadingProps = z.infer<typeof subheadingProps>;
type ParagraphProps = z.infer<typeof paragraphProps>;
type LabelProps = z.infer<typeof labelProps>;
type CaptionProps = z.infer<typeof captionProps>;

const HEADING_SIZE: Record<1 | 2 | 3, number> = { 1: 32, 2: 24, 3: 20 };

export const HeadingRenderer: FC<HeadingProps> = ({ text, level, color, align }) => {
  const brand = useBrand();
  return (
    <Text
      style={{
        fontFamily: 'URWGeometric',
        fontWeight: 700,
        fontSize: HEADING_SIZE[level ?? 1],
        lineHeight: 1.25,
        color: color ?? brand.colors.dark,
        textAlign: align,
      }}
    >
      {text}
    </Text>
  );
};

export const SubheadingRenderer: FC<SubheadingProps> = ({ text, color }) => {
  const brand = useBrand();
  return (
    <Text
      style={{
        ...typography.subheading,
        color: color ?? brand.colors.dark,
        fontFamily: 'URWGeometric',
      }}
    >
      {text}
    </Text>
  );
};

export const ParagraphRenderer: FC<ParagraphProps> = ({ text, muted, align, size }) => {
  const brand = useBrand();
  return (
    <Text
      style={{
        ...typography.body,
        fontFamily: 'URWGeometric',
        color: muted ? brand.colors.gray : typography.body.color,
        textAlign: align,
        fontSize: size ?? typography.body.fontSize,
      }}
    >
      {text}
    </Text>
  );
};

export const LabelRenderer: FC<LabelProps> = ({ text, uppercase, color }) => (
  <Text
    style={{
      ...typography.label,
      fontFamily: 'URWGeometric',
      color: color ?? typography.label.color,
      textTransform: uppercase ? 'uppercase' : undefined,
    }}
  >
    {text}
  </Text>
);

export const CaptionRenderer: FC<CaptionProps> = ({ text, color }) => (
  <Text
    style={{
      ...typography.small,
      fontFamily: 'URWGeometric',
      color: color ?? typography.small.color,
    }}
  >
    {text}
  </Text>
);
