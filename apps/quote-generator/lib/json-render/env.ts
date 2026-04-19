import fs from 'fs';
import { resolveQuoteGeneratorPath } from '@/lib/documents/quote/shared/asset-paths';

// Side-effect import: register URWGeometric before any renderer touches react-pdf.
import '@/lib/documents/quote/shared/fonts';

function loadAsset(filename: string): string {
  try {
    const filePath = resolveQuoteGeneratorPath('public', filename);
    if (fs.existsSync(filePath)) {
      return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;
    }
  } catch {
    // fall through to empty string
  }
  return '';
}

// Keys are the public contract for the spec. Values are filesystem filenames
// under /public. Never accept raw base64 from the spec body — authors
// reference assets by key only.
const ASSET_MAP = {
  logoDark: 'noxe-logo-dark.png',
  hexPatternTopRight: 'topRight-hexagonal-pattern.png',
  hexPatternBottomRight: 'bottomRight-hexagonal-pattern.png',
  arrowsFooter: 'three-arrows-dark.png',
  noxeXLogoDark: 'noxe-X-logo-dark.png',
  arrowDark: 'dark-arrow-right.png',
  arrowGray: 'gray-arrow-right.png',
  arrowLightGray: 'lightGray-arrow-right.png',
  infoIcon: 'info.png',
} as const;

export type AssetKey = keyof typeof ASSET_MAP;

export const ASSET_KEYS = Object.keys(ASSET_MAP) as AssetKey[];

let cached: Record<AssetKey, string> | null = null;

export function loadBrandAssets(): Record<AssetKey, string> {
  if (cached) return cached;
  const out = {} as Record<AssetKey, string>;
  for (const key of ASSET_KEYS) {
    out[key] = loadAsset(ASSET_MAP[key]);
  }
  cached = out;
  return out;
}
