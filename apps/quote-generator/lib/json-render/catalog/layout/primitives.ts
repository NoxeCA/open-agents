import { z } from 'zod';
import { defineComponent } from '../types';

const alignEnum = z
  .enum(['start', 'center', 'end', 'space-between', 'space-around'])
  .describe(
    'Alignment along the container axis. "start"/"center"/"end" map to flexbox cross-axis alignItems; "space-between"/"space-around" map to justifyContent for distributing children along the main axis. Omit to let children fall back to their natural alignment.'
  );

export const hstackProps = z.object({
  gap: z
    .number()
    .nonnegative()
    .default(0)
    .describe(
      'Horizontal gap between children in points (pts). 1pt ~= 1.33px at 96 DPI, so 12pt ~= 16px. Implemented via react-pdf native `gap` on a flex row — no margin hack, no trailing child special-casing. Use 8pt for tight icon+label rows, 16pt for balanced hero rows; default 0 tightly packs children.'
    ),
  align: alignEnum.optional(),
  wrap: z
    .boolean()
    .default(false)
    .describe(
      'When true, enables flex-wrap so overflowing children move to a new row. Use true for tag/pill rows that may exceed the page width; leave false for fixed icon+label rows where overflow is a bug.'
    ),
});

export const vstackProps = z.object({
  gap: z
    .number()
    .nonnegative()
    .default(0)
    .describe(
      'Vertical gap between children in points (pts). 1pt ~= 1.33px at 96 DPI, so 12pt ~= 16px. Uses react-pdf native `gap` on a flex column — no margin hack. Use 6pt for dense form rows, 12-16pt for body paragraphs, 24pt between major blocks.'
    ),
  align: alignEnum.optional(),
});

export const sectionProps = z.object({
  gap: z
    .number()
    .nonnegative()
    .default(16)
    .describe(
      'Vertical gap between section children in points (pts). 1pt ~= 1.33px at 96 DPI, so 16pt ~= 21px (the default, matching the brand body-rhythm). Uses react-pdf native `gap` on a flex column. Lower to 12pt for dense content; raise to 24pt between major thematic groups.'
    ),
});

export const spacerProps = z.object({
  height: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Fixed vertical size in points (pts). Use inside a VStack or at the top of a Page to introduce deterministic gaps (e.g. 24pt between a heading and the next block). Omit together with `width` to get the flex-fill behavior.'
    ),
  width: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Fixed horizontal size in points (pts). Use inside an HStack to introduce deterministic gaps between a left cluster and a right cluster. Omit together with `height` to get the flex-fill behavior.'
    ),
});

export const dividerProps = z.object({
  color: z
    .string()
    .optional()
    .describe(
      'Line color as a hex (e.g. "#DADDE1") or rgba string. Defaults to brand.colors.borderLight. Override with brand.colors.dark for emphasized separators inside a DarkHeaderBox.'
    ),
  thickness: z
    .number()
    .positive()
    .default(1)
    .describe(
      'Line thickness in points (pts). Default 1pt matches the brand standard hairline; bump to 2pt for emphasized separators under section headers.'
    ),
  vertical: z
    .boolean()
    .default(false)
    .describe(
      'If true, renders a vertical divider that stretches to the parent container\'s height instead of the default horizontal hairline. Use inside an HStack to separate two inline columns (e.g. quoteDate | validUntil). Defaults to false.'
    ),
});

export const boxProps = z.object({
  padding: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Uniform inner padding in points (pts) on all four sides. Takes precedence over paddingX/paddingY when set. Use 16pt for card-like containers, 8pt for tight chips.'
    ),
  paddingX: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Horizontal inner padding (left + right) in points (pts). Use when horizontal and vertical padding must differ (e.g. pill shapes with paddingX=10, paddingY=6). Ignored when `padding` is set.'
    ),
  paddingY: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Vertical inner padding (top + bottom) in points (pts). Use alongside paddingX when horizontal and vertical padding differ. Ignored when `padding` is set.'
    ),
  background: z
    .string()
    .optional()
    .describe(
      'Background color as hex (e.g. "#F3F4F6") or rgba. Use brand.colors.rowAlt for alternating row shading; use brand.colors.dark for high-contrast stat callouts. Omit for transparent.'
    ),
  border: z
    .string()
    .optional()
    .describe(
      'Border color as hex or rgba. Applies a 1pt border on all four sides (thickness is not configurable here). Omit for no border; use brand.colors.borderLight for subtle cards.'
    ),
  radius: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Corner radius in points (pts). Use 6pt for cards matching DarkHeaderBox, 99pt for pill shapes. Omit for sharp corners.'
    ),
  flex: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'CSS flex-grow value. Set `flex: 1` on a Box inside an HStack to consume remaining horizontal space. Omit for natural intrinsic sizing.'
    ),
});

export const HStack = defineComponent({
  name: 'HStack',
  kind: 'container',
  category: 'layout',
  props: hstackProps,
  description:
    'Row container that arranges children left-to-right using a flex row with optional gap, alignment, and wrap. Use for icon+label rows, multi-column info grids, and any horizontal group on a Page. Don\'t use for vertical stacking — use VStack — and don\'t use for thematic content groups — use Section.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'HStack',
        children: [
          { type: 'Label', text: 'Status:' },
          { type: 'Label', text: 'Approved' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'HStack',
        gap: 12,
        align: 'space-between',
        wrap: true,
        children: [
          { type: 'Label', text: 'Noxe Inc.' },
          { type: 'Label', text: 'QUOTE' },
        ],
      },
    },
  ],
});

export const VStack = defineComponent({
  name: 'VStack',
  kind: 'container',
  category: 'layout',
  props: vstackProps,
  description:
    'Column container that arranges children top-to-bottom using a flex column with optional gap and alignment. Use as the default wrapper inside a Page when you need explicit vertical rhythm control (e.g. a Heading followed by a Paragraph followed by a BulletList). Don\'t use for horizontal rows — use HStack — and prefer Section when you want the brand\'s 16pt default rhythm.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'VStack',
        children: [
          { type: 'Heading', text: 'Title' },
          { type: 'Paragraph', text: 'Body.' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'VStack',
        gap: 16,
        align: 'start',
        children: [
          { type: 'Heading', text: 'Overview', level: 2 },
          { type: 'Paragraph', text: 'Detailed overview paragraph.' },
          { type: 'Divider', thickness: 1 },
        ],
      },
    },
  ],
});

export const Section = defineComponent({
  name: 'Section',
  kind: 'container',
  category: 'layout',
  props: sectionProps,
  description:
    'Thematic vertical content block. Effectively a VStack with a 16pt default gap that matches the brand rhythm for body copy. Use for the main body of a content page (About Us, Scope) where children are a mix of Heading/Paragraph/BulletList and you want consistent spacing without specifying gap. Don\'t use for arbitrary vertical stacking where you need non-16pt gaps — use VStack.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'Section',
        children: [
          { type: 'Heading', text: 'About Us', level: 2 },
          { type: 'Paragraph', text: 'We design smart building systems.' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'Section',
        gap: 24,
        children: [
          { type: 'SectionHeader', number: 2, name: 'Scope' },
          { type: 'Paragraph', text: 'The following items are in scope.' },
          {
            type: 'BulletList',
            items: ['Item A', 'Item B', 'Item C'],
            variant: 'dot',
          },
        ],
      },
    },
  ],
});

export const Spacer = defineComponent({
  name: 'Spacer',
  kind: 'leaf',
  category: 'layout',
  props: spacerProps,
  description:
    'Flexible or fixed spacer. With neither `height` nor `width` set, it renders with `flex: 1` and consumes remaining space — use this to push content to the top or bottom of a Page (e.g. a footer-anchored total). With `height` or `width` set, it acts as a fixed-size gap. Don\'t use to separate inline text runs — let Paragraph wrap — and don\'t use when a VStack/HStack `gap` prop would do.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Spacer' },
    },
    {
      label: 'full',
      spec: { type: 'Spacer', height: 24, width: 0 },
    },
  ],
});

export const Divider = defineComponent({
  name: 'Divider',
  kind: 'leaf',
  category: 'layout',
  props: dividerProps,
  description:
    'Thin horizontal or vertical rule for separating content blocks. Use between major sub-sections inside a Section or between inline columns in an HStack (vertical). Don\'t use as decoration inside text flow (prefer a dash glyph) and don\'t use for thick separators — use a Box with a background instead.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Divider' },
    },
    {
      label: 'full',
      spec: { type: 'Divider', color: '#DADDE1', thickness: 2, vertical: false },
    },
  ],
});

export const Box = defineComponent({
  name: 'Box',
  kind: 'container',
  category: 'layout',
  props: boxProps,
  description:
    'Generic styled container supporting padding, background, border, radius, and flex-grow. Use for ad-hoc cards, callouts, pill shapes, and any visual container that is not already covered by a dedicated brand primitive. Don\'t use as a replacement for DarkHeaderBox or SectionHeader — those render the brand-specific chrome — and don\'t use merely for vertical stacking (use VStack).',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'Box',
        padding: 16,
        children: [{ type: 'Paragraph', text: 'Inside a box.' }],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'Box',
        paddingX: 16,
        paddingY: 12,
        background: '#F3F4F6',
        border: '#DADDE1',
        radius: 6,
        flex: 1,
        children: [
          { type: 'Label', text: 'Quote ID' },
          { type: 'Paragraph', text: 'EA102-AL' },
        ],
      },
    },
  ],
});
