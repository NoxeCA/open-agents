import React, { FC } from 'react';
import { Text, View } from '@react-pdf/renderer';
import { useBrand } from '../../brand';
import type { darkHeaderBoxProps, sectionHeaderProps } from '../../catalog/brand/primitives';
import type { z } from 'zod';

type DarkHeaderBoxProps = z.infer<typeof darkHeaderBoxProps>;
type SectionHeaderProps = z.infer<typeof sectionHeaderProps>;

export const DarkHeaderBoxRenderer: FC<DarkHeaderBoxProps> = ({ eyebrow, title, subtitle }) => {
  const brand = useBrand();
  return (
    <View
      style={{
        backgroundColor: brand.colors.dark,
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      {eyebrow && (
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontSize: 9,
            fontWeight: 400,
            color: brand.colors.cyan,
            marginBottom: 2,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {eyebrow}
        </Text>
      )}
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontSize: 14,
          fontWeight: 700,
          color: brand.colors.white,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontSize: 10,
            fontWeight: 400,
            color: brand.colors.white,
            opacity: 0.75,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export const SectionHeaderRenderer: FC<SectionHeaderProps> = ({ number, name }) => {
  const brand = useBrand();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
      {number != null && (
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontSize: 32,
            fontWeight: 700,
            color: brand.colors.gray,
          }}
        >
          {String(number).padStart(2, '0')}
        </Text>
      )}
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontSize: 20,
          fontWeight: 700,
          color: brand.colors.dark,
        }}
      >
        {name}
      </Text>
    </View>
  );
};
