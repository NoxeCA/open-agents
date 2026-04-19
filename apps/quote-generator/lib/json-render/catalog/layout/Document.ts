import { z } from 'zod';
import { defineComponent } from '../types';

export const documentProps = z.object({
  lang: z
    .enum(['fr', 'en'])
    .default('fr')
    .describe(
      'Document language. Drives currency/date/number formatting (e.g. "2 500,00 $" vs "$2,500.00") and selects the brand translation bundle for all built-in labels (TOC title, "Total Cost", "Prepared For", etc.). Set "en" for English-speaking clients; defaults to "fr".'
    ),
});

export const Document = defineComponent({
  name: 'Document',
  kind: 'container',
  category: 'layout',
  props: documentProps,
  description:
    'Root node of a quote spec and the only valid top-level `document` in the render envelope. Use it once per PDF to wrap all Page nodes and to set the language for formatters/translations. Don\'t use for anything other than the outermost container; for individual pages use `Page`, and for multi-page quote sections use `ServiceSection`.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'Document',
        children: [
          {
            type: 'Page',
            children: [{ type: 'Heading', text: 'Hello' }],
          },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'Document',
        lang: 'en',
        children: [
          {
            type: 'Page',
            header: false,
            footer: 'none',
            children: [
              {
                type: 'CoverBlock',
                subtitle: 'Proposal for Acme Corp',
                documentType: 'QUOTE',
                documentTitle: 'Video Surveillance — Phase 2',
                quoteID: 'EA102-AL',
                revision: 1,
                quoteDate: '2026-04-19',
                validUntil: '2026-05-19',
                preparedFor: [{ name: 'Jane Doe' }],
                preparedBy: [{ name: 'John Smith' }],
              },
            ],
          },
          {
            type: 'Page',
            sectionId: 'about-us',
            header: 'PROPOSAL',
            children: [{ type: 'Heading', text: 'About Us', level: 1 }],
          },
        ],
      },
    },
  ],
});
