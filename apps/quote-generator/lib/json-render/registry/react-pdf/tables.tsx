import React, { FC } from 'react';
import { View } from '@react-pdf/renderer';
import { getTranslations } from '@/lib/locales/loader';
import {
  BomCardTop,
  BomDataRows,
} from '@/lib/documents/quote/pages/09-service-section/BomTable';
import OtherCostsTable from '@/lib/documents/quote/pages/09-service-section/OtherCostsTable';
import { useBrand } from '../../brand';
import type { bomTableProps, laborBlockProps } from '../../catalog/tables/primitives';
import type { z } from 'zod';

type BomTableProps = z.infer<typeof bomTableProps>;
type LaborBlockProps = z.infer<typeof laborBlockProps>;

export const BomTableRenderer: FC<BomTableProps> = ({
  layout,
  sectionName,
  items,
  subtotal,
  repeatHeader,
}) => {
  const brand = useBrand();
  const lang = brand.translations;
  const selectedLang = brand.lang;
  return (
    <>
      {repeatHeader !== false ? (
        <View fixed>
          <BomCardTop sectionName={sectionName} layout={layout} lang={lang} />
        </View>
      ) : (
        <BomCardTop sectionName={sectionName} layout={layout} lang={lang} />
      )}
      <BomDataRows
        items={items}
        subtotal={subtotal}
        layout={layout}
        lang={lang}
        selectedLang={selectedLang}
      />
    </>
  );
};

export const LaborBlockRenderer: FC<LaborBlockProps> = ({
  sectionName,
  items,
  subtotal,
  title,
}) => {
  const brand = useBrand();
  // Optionally override the hardcoded title in the legacy component by
  // forking lang. The existing OtherCostsTable reads lang.service.laborAndServices.
  const lang = title
    ? {
        ...brand.translations,
        service: { ...brand.translations.service, laborAndServices: title },
      }
    : brand.translations;
  return (
    <OtherCostsTable
      items={items}
      subtotal={subtotal}
      sectionName={sectionName}
      lang={lang}
      selectedLang={brand.lang}
    />
  );
};

// Re-export for lang typing in ServiceSection composite.
export { getTranslations };
