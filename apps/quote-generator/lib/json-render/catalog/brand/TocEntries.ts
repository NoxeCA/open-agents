import { z } from 'zod';
import { defineComponent } from '../types';

export const tocEntriesProps = z.object({
  entries: z
    .array(
      z.object({
        label: z
          .string()
          .min(1)
          .describe(
            'Human-readable row label shown on the left side of the TOC row (e.g. "About Us", "Our Team"). Plain string, no markdown.'
          ),
        sectionId: z
          .string()
          .min(1)
          .describe(
            'sectionId of the Page this row links to. Must exactly match a `sectionId` on a Page (or ServiceSection) in the same Document, otherwise the resolved page number will be blank. Use kebab-case like "about-us" or "service-1".'
          ),
      })
    )
    .min(1)
    .describe(
      'Ordered TOC rows. Each row is label + sectionId; the page number is resolved automatically during the two-pass render by looking up the matching Page/ServiceSection. Must contain at least one entry.'
    ),
  title: z
    .string()
    .optional()
    .describe(
      'Optional title shown above the list (e.g. "Table of Contents" or "Contenu"). Omit to use the brand translation default from lang.common.tableOfContents.'
    ),
  combine: z
    .array(
      z.object({
        label: z
          .string()
          .min(1)
          .describe(
            'Row label for a spanning entry (e.g. "Extensive Service Offering"). Plain string.'
          ),
        sectionIds: z
          .array(z.string())
          .min(1)
          .describe(
            'Ordered list of sectionIds whose page ranges combine to form this row\'s page reference. Example spanning multiple services: ["service-1", "service-2", "service-3"] renders as "p. 5-12" when those sections span pages 5 through 12.'
          ),
      })
    )
    .optional()
    .describe(
      'Additional TOC rows whose page range spans multiple sections. Use to create an umbrella row like {label: "Extensive Service Offering", sectionIds: ["service-1","service-2","service-3"]} that renders a single row with the min..max page range of the listed sections.'
    ),
});

export const TocEntries = defineComponent({
  name: 'TocEntries',
  kind: 'leaf',
  category: 'brand',
  props: tocEntriesProps,
  description:
    'Renders the Table of Contents card. Place as the only child of page 2 (the TOC page). The Document must also contain Pages tagged with matching sectionId values; page ranges are computed at render time via a two-pass render, so the first render collects page numbers and the second fills them in. Don\'t use on any other page and don\'t hand-author page numbers — they are derived automatically.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'TocEntries',
        entries: [
          { label: 'About Us', sectionId: 'about-us' },
          { label: 'Our Team', sectionId: 'team' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'TocEntries',
        title: 'Table of Contents',
        entries: [
          { label: 'About Us', sectionId: 'about-us' },
          { label: 'Our Approach', sectionId: 'approach' },
          { label: 'Scope', sectionId: 'scope' },
        ],
        combine: [
          {
            label: 'Extensive Service Offering',
            sectionIds: ['service-1', 'service-2', 'service-3'],
          },
        ],
      },
    },
  ],
});
