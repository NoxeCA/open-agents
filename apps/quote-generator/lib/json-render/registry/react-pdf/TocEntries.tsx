import React, { FC } from 'react';
import { Text, View } from '@react-pdf/renderer';
import { formatPageRange } from '@/lib/documents/quote/shared/pagination';
import { useBrand } from '../../brand';
import type { tocEntriesProps } from '../../catalog/brand/TocEntries';
import type { z } from 'zod';
import { usePageNumbers } from './page-numbers';

type TocEntriesProps = z.infer<typeof tocEntriesProps>;

export const TocEntriesRenderer: FC<TocEntriesProps> = ({ entries, title, combine }) => {
  const brand = useBrand();
  const pn = usePageNumbers();
  const resolvedTitle = title ?? brand.translations.toc.title;

  const rows: { label: string; page: string }[] = entries.map(e => ({
    label: e.label,
    page: formatPageRange(pn[e.sectionId]),
  }));

  if (combine) {
    for (const c of combine) {
      const ranges = c.sectionIds.map(id => pn[id]).filter(Boolean);
      if (ranges.length === 0) {
        rows.push({ label: c.label, page: '-' });
        continue;
      }
      const start = Math.min(...ranges.map(r => r.start));
      const end = Math.max(...ranges.map(r => r.end));
      rows.push({
        label: c.label,
        page: formatPageRange({ start, end }),
      });
    }
  }

  return (
    <View style={{ flexDirection: 'column' }}>
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1.375,
          color: brand.colors.dark,
          marginBottom: 24,
        }}
      >
        {resolvedTitle}
      </Text>
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 700,
              fontSize: 16,
              color: brand.colors.gray,
            }}
          >
            {row.label}
          </Text>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 700,
              fontSize: 18,
              color: brand.colors.gray,
              textAlign: 'right',
              width: 40,
            }}
          >
            {row.page}
          </Text>
        </View>
      ))}
    </View>
  );
};
