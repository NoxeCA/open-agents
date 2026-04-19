import React, { FC } from 'react';
import { Image as RPdfImage, Text, View } from '@react-pdf/renderer';
import { useBrand } from '../../brand';
import { ASSET_KEYS, type AssetKey } from '../../env';
import type {
  imageProps,
  bulletListProps,
  valuePillGridProps,
} from '../../catalog/content/primitives';
import type { z } from 'zod';

type ImageProps = z.infer<typeof imageProps>;
type BulletListProps = z.infer<typeof bulletListProps>;
type ValuePillGridProps = z.infer<typeof valuePillGridProps>;

function isAssetKey(src: string): src is AssetKey {
  return (ASSET_KEYS as string[]).includes(src);
}

export const ImageRenderer: FC<ImageProps> = ({ src, width, height, align }) => {
  const brand = useBrand();
  let resolved = src;
  if (isAssetKey(src)) {
    resolved = brand.assets[src];
  } else if (!src.startsWith('data:')) {
    throw new Error(
      `Image.src must be a brand asset key or a data: URI. Got "${src.slice(0, 32)}..."`
    );
  }
  if (!resolved) return null;
  const img = <RPdfImage src={resolved} style={{ width, height }} />;
  if (align === 'center') {
    return <View style={{ alignItems: 'center' }}>{img}</View>;
  }
  if (align === 'right') {
    return <View style={{ alignItems: 'flex-end' }}>{img}</View>;
  }
  return img;
};

const BULLET_GLYPH: Record<'dot' | 'dash' | 'arrow', string> = {
  dot: '\u2022',
  dash: '\u2013',
  arrow: '\u2192',
};

export const BulletListRenderer: FC<BulletListProps> = ({ items, variant, color }) => {
  const brand = useBrand();
  const c = color ?? brand.colors.dark;
  return (
    <View style={{ flexDirection: 'column', gap: 6 }}>
      {items.map((text, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontSize: 10,
              color: c,
              width: 10,
            }}
          >
            {BULLET_GLYPH[variant ?? 'dot']}
          </Text>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontSize: 10,
              lineHeight: 1.4,
              color: c,
              flex: 1,
            }}
          >
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
};

export const ValuePillGridRenderer: FC<ValuePillGridProps> = ({ items, columns, tone }) => {
  const brand = useBrand();
  const cols = columns ?? 3;
  const t = tone ?? 'dark';
  const pillStyle =
    t === 'dark'
      ? { backgroundColor: brand.colors.dark, color: brand.colors.white, borderColor: brand.colors.dark }
      : t === 'light'
      ? { backgroundColor: brand.colors.rowAlt, color: brand.colors.dark, borderColor: brand.colors.borderLight }
      : { backgroundColor: 'transparent', color: brand.colors.dark, borderColor: brand.colors.borderLight };
  const widthPct = `${Math.floor(100 / cols - 2)}%`;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 } as any}>
      {items.map((label, i) => (
        <View
          key={i}
          style={{
            width: widthPct as any,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 99,
            borderWidth: 1,
            borderColor: pillStyle.borderColor,
            backgroundColor: pillStyle.backgroundColor,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontSize: 10,
              color: pillStyle.color,
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
};
