import { z } from 'zod';
import { ASSET_KEYS } from '../../env';
import { defineComponent } from '../types';

export const imageProps = z.object({
  src: z
    .string()
    .min(1)
    .describe(
      "Image source. Must be either (a) one of the built-in brand asset keys: 'logoDark' | 'hexPatternTopRight' | 'hexPatternBottomRight' | 'arrowsFooter' | 'noxeXLogoDark' | 'arrowDark' | 'arrowGray' | 'arrowLightGray' | 'infoIcon' (resolved server-side to the matching /public PNG), or (b) a base64 data URI starting with 'data:' (use for client-supplied logos/photos). Raw http(s):// URLs and bare filenames are rejected at render time. Known asset keys at catalog build time: " +
        ASSET_KEYS.join(', ') +
        '.'
    ),
  width: z
    .number()
    .positive()
    .optional()
    .describe(
      'Target width in points (pts). Omit to let react-pdf use the intrinsic image width. Set together with `height` to fit an image into a fixed slot (e.g. 64x17 for the footer logo).'
    ),
  height: z
    .number()
    .positive()
    .optional()
    .describe(
      'Target height in points (pts). Omit to let react-pdf derive height from the width + aspect ratio. Set together with `width` to enforce a fixed slot.'
    ),
  align: z
    .enum(['left', 'center', 'right'])
    .default('left')
    .describe(
      'Horizontal alignment within the parent container. "left" is the natural flow; "center" wraps in a centered View; "right" wraps in a flex-end View. Defaults to "left".'
    ),
});

export const bulletListProps = z.object({
  items: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      'Ordered list of bullet items. Each item is a plain string — no markdown. Use for scope items, exclusions, and payment-terms rows; keep each item under ~120 chars to avoid awkward multi-line wraps.'
    ),
  variant: z
    .enum(['dot', 'dash', 'arrow'])
    .default('dot')
    .describe(
      'Bullet marker glyph. "dot" (•, U+2022) is the brand default for generic lists; "dash" (–, U+2013) for neutral lists or exclusions; "arrow" (→, U+2192) for sequence/flow lists. Defaults to "dot".'
    ),
  color: z
    .string()
    .optional()
    .describe(
      'Marker and text color as hex or rgba. Defaults to brand.colors.dark. Set to brand.colors.cyan for accent rows inside a DarkHeaderBox, or brand.colors.gray for muted exclusions.'
    ),
});

export const valuePillGridProps = z.object({
  items: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      'Pill labels. Each item is a plain string rendered inside a rounded pill. Use for short tags (1-3 words each) like company values or capabilities; avoid long phrases that force ugly pill wrapping.'
    ),
  columns: z
    .union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .default(3)
    .describe(
      'Number of pills per row. Wraps to new rows when items exceed the row capacity. Pick 2-3 for longer labels, 4-5 for short one-word tags. Defaults to 3.'
    ),
  tone: z
    .enum(['dark', 'light', 'outline'])
    .default('dark')
    .describe(
      'Visual tone: "dark" = filled dark background with white text (high-contrast hero use), "light" = subtle rowAlt background with dark text (secondary lists), "outline" = transparent with a thin border (tertiary lists). Defaults to "dark".'
    ),
});

export const Image = defineComponent({
  name: 'Image',
  kind: 'leaf',
  category: 'content',
  props: imageProps,
  description:
    'Raster image with either a brand asset key or a base64 data URI as source. Use brand asset keys (e.g. "logoDark", "hexPatternTopRight") for Noxe chrome; use a `data:` URI for client-supplied logos/photos. Don\'t pass a raw URL or a bare filename — those are rejected at render time — and don\'t use for vector brand marks that are already baked into other components (e.g. CoverBlock embeds the logo itself).',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Image', src: 'logoDark' },
    },
    {
      label: 'full',
      spec: {
        type: 'Image',
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==',
        width: 120,
        height: 40,
        align: 'center',
      },
    },
  ],
});

export const BulletList = defineComponent({
  name: 'BulletList',
  kind: 'leaf',
  category: 'content',
  props: bulletListProps,
  description:
    "Simple bullet list with configurable glyph (dot/dash/arrow). Use for scope/exclusions/payment-terms rows and for any short enumerated list on proposal pages. Don't use to render a priced line-items list — for that use `BomTable` with `layout: 'itemized-without-price'`. Don't use for comma-joined inline content — for that use a Paragraph.",
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'BulletList',
        items: ['Install cameras', 'Configure NVR', 'Commission'],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'BulletList',
        items: ['Net-30 payment terms', 'Prices in USD', 'Valid for 30 days'],
        variant: 'arrow',
        color: '#00B8D4',
      },
    },
  ],
});

export const ValuePillGrid = defineComponent({
  name: 'ValuePillGrid',
  kind: 'leaf',
  category: 'content',
  props: valuePillGridProps,
  description:
    'Grid of short rounded pills — the brand primitive for tag-like enumerations (e.g. company values, capability tags, certifications). Use on the About Us page or next to a Subheading like "What we do". Don\'t use for priced items (use BomTable) and don\'t use for long phrases that force multi-line pills (use BulletList).',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'ValuePillGrid', items: ['Integrity', 'Quality', 'Safety'] },
    },
    {
      label: 'full',
      spec: {
        type: 'ValuePillGrid',
        items: ['Integrity', 'Quality', 'Safety', 'Innovation', 'Service'],
        columns: 5,
        tone: 'outline',
      },
    },
  ],
});
