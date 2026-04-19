import { COMPANY_INFO, TAX_NUMBERS, colors } from '@/lib/documents/shared/constants';
import { getTranslations, type Language, type QuoteTranslations } from '@/lib/locales/loader';
import { loadBrandAssets, type AssetKey } from '../env';
import type { BrandConfigOverride } from './schema';

export interface BrandConfig {
  lang: Language;
  colors: typeof colors;
  fonts: { family: string };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumbers: { label: string; value: string }[];
  };
  assets: Record<AssetKey, string>;
  translations: QuoteTranslations;
}

export function buildBrandConfig(
  lang: Language,
  override?: BrandConfigOverride
): BrandConfig {
  const translationsLang = (override?.translations ?? lang) as Language;
  return {
    lang,
    colors,
    fonts: { family: 'URWGeometric' },
    company: {
      name: override?.company?.name ?? COMPANY_INFO.name,
      address: override?.company?.address ?? COMPANY_INFO.address,
      phone: override?.company?.phone ?? COMPANY_INFO.phone,
      email: override?.company?.email ?? COMPANY_INFO.email,
      taxNumbers: TAX_NUMBERS,
    },
    assets: loadBrandAssets(),
    translations: getTranslations('quote', translationsLang),
  };
}
