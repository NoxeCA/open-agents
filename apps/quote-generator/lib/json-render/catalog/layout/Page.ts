import { z } from 'zod';
import { defineComponent } from '../types';

export const pageProps = z.object({
  sectionId: z
    .string()
    .optional()
    .describe(
      'Stable identifier used by TocEntries to resolve this page to a page number at render time. Required if this page should appear in a TocEntries reference. Use kebab-case strings like "about-us" or numeric-ish strings like "service-1". Omit for the cover or decorative pages that the TOC does not link to.'
    ),
  size: z
    .enum(['LETTER', 'A4'])
    .default('LETTER')
    .describe(
      'Paper size. Use "LETTER" (US 8.5x11in) for North American clients; use "A4" for EU/international clients. Defaults to "LETTER"; set explicitly only when you need the other paper stock.'
    ),
  header: z
    .union([z.literal(false), z.string()])
    .optional()
    .describe(
      'Running page header rendered at the top of every physical page this Page produces. Use `false` for the cover page to get a full-bleed layout with no chrome; otherwise set a short text label like "QUOTE" or "PROPOSAL" shown in gray. Omit to render no header text but keep the standard padded layout.'
    ),
  footer: z
    .enum(['default', 'none'])
    .default('default')
    .describe(
      'Footer chrome control. "default" shows the Noxe dark logo on the left and the three-arrows mark on the right; "none" hides the footer entirely (use on the cover page paired with `header: false`). Defaults to "default".'
    ),
  padding: z
    .number()
    .positive()
    .optional()
    .describe(
      'Override for the page inner padding in points (pts). Omit to use the brand default (spacing.pagePadding, ~30pts). Set a smaller value for dense table pages that need more horizontal room.'
    ),
  bottomReserve: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Extra bottom padding (in pts) reserved inside the content area so fixed footers or wrap-sensitive totals do not collide with overflowing content. Set ~24pts on pages hosting a BomTable that may overflow and needs clearance above the footer. Omit when no overflow is expected.'
    ),
});

export const Page = defineComponent({
  name: 'Page',
  kind: 'container',
  category: 'layout',
  props: pageProps,
  description:
    'A single logical PDF page. Use for every standard content page (cover, TOC, about-us, scope, priced sections that are NOT driven by ServiceSection). Tag with `sectionId` whenever the Table of Contents must link to it. Don\'t use as the root of a spec (wrap in `Document`) and don\'t wrap a `ServiceSection` in a Page — ServiceSection emits its own pages at the document level.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'Page',
        children: [{ type: 'Heading', text: 'Hello' }],
      },
    },
    {
      label: 'typical',
      spec: {
        type: 'Page',
        sectionId: 'about-us',
        header: 'PROPOSAL',
        footer: 'default',
        children: [
          { type: 'SectionHeader', number: 1, name: 'About Us' },
          { type: 'Paragraph', text: 'Noxe designs and installs smart building systems.' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'Page',
        sectionId: 'scope',
        size: 'LETTER',
        header: 'QUOTE',
        footer: 'default',
        padding: 32,
        bottomReserve: 24,
        children: [
          { type: 'Heading', text: 'Scope of Work', level: 1 },
          {
            type: 'BulletList',
            variant: 'dot',
            items: ['Install 12 IP cameras', 'Configure NVR', 'Commission & training'],
          },
        ],
      },
    },
  ],
});
