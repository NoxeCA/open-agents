import { z } from 'zod';
import { personRefSchema, dateFieldSchema } from '@/lib/documents/quote/shared/schemas';
import { defineComponent } from '../types';

export const coverBlockProps = z.object({
  clientLogo: z
    .string()
    .optional()
    .describe(
      'Optional client-supplied logo as a base64 data URI (starting with "data:"). Rendered in the top-left slot at fixed size. Omit to fall back to the client name text alone; if both `clientLogo` and `clientName` are provided, the logo is shown with the name beneath it.'
    ),
  clientName: z
    .string()
    .optional()
    .describe(
      'Client company or recipient name shown at the top-left — either beneath the `clientLogo` or on its own when no logo is provided. Omit to leave the top-left empty when only the Noxe brand should appear.'
    ),
  subtitle: z
    .string()
    .min(1)
    .describe(
      'Small eyebrow label above the main document type (e.g. "Proposal for Acme Corp", "Quote pour Acme Corp"). Required. Keep short (under ~50 chars) to avoid visual imbalance with the huge documentType below.'
    ),
  documentType: z
    .string()
    .min(1)
    .describe(
      'Large uppercase headline on the cover (e.g. "QUOTE", "PROPOSAL", "MASTER SERVICE AGREEMENT"). Required. Rendered in the largest typographic scale — keep it to 1-3 short words.'
    ),
  documentTitle: z
    .string()
    .min(1)
    .describe(
      'Project title shown below the document type (e.g. "Video Surveillance — Phase 2"). Required. The specific project name that distinguishes this document from other quotes of the same type.'
    ),
  quoteID: z
    .string()
    .min(1)
    .describe(
      'Quote identifier shown in the info grid (e.g. "EA102-AL"). Required. Rendered alongside the revision number as "EA102-AL / Revision 1".'
    ),
  revision: z
    .number()
    .int()
    .positive()
    .describe(
      'Revision number (1-based integer). Required. Shown in the info grid next to quoteID — bump on each re-issue of the quote to the client.'
    ),
  quoteDate: dateFieldSchema.describe(
    'Quote issue date in ISO format YYYY-MM-DD (e.g. "2026-04-19"). Rendered long-formatted per the document language ("April 19, 2026" / "19 avril 2026"). Required.'
  ),
  validUntil: dateFieldSchema.describe(
    'Quote expiry date in ISO format YYYY-MM-DD. Typically 30-60 days after quoteDate. Rendered long-formatted per the document language. Required.'
  ),
  preparedFor: z
    .array(personRefSchema)
    .min(1)
    .describe(
      'Ordered list of recipient people (at least one). Each entry needs `name`. Names over 22 characters are auto-abbreviated backward (e.g. "Jean-Claude Van Damme" -> "Jean-C. V. D."). Omit email/phone — the cover shows names only.'
    ),
  preparedBy: z
    .array(personRefSchema)
    .min(1)
    .describe(
      'Ordered list of author people (at least one). Each entry needs `name`. Names over 22 characters are auto-abbreviated backward, same rule as preparedFor.'
    ),
});

export type CoverBlockProps = z.infer<typeof coverBlockProps>;

export const CoverBlock = defineComponent({
  name: 'CoverBlock',
  kind: 'leaf',
  category: 'composite',
  props: coverBlockProps,
  description:
    'The Noxe quote cover page. Includes the optional client logo/name (top-left), the title block (subtitle + large documentType + documentTitle), and an info grid with quote number/date/validity and preparedFor/preparedBy. Must be the only child of the first Page in the Document, and that Page must have `header: false, footer: \'none\'` to get the full-bleed cover layout. Don\'t use on non-cover pages — it positions itself with absolute/full-bleed styling.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'CoverBlock',
        subtitle: 'Proposal for Acme Corp',
        documentType: 'QUOTE',
        documentTitle: 'Video Surveillance',
        quoteID: 'EA102-AL',
        revision: 1,
        quoteDate: '2026-04-19',
        validUntil: '2026-05-19',
        preparedFor: [{ name: 'Jane Doe' }],
        preparedBy: [{ name: 'John Smith' }],
      },
    },
    {
      label: 'typical',
      spec: {
        type: 'CoverBlock',
        clientName: 'Acme Corp',
        subtitle: 'Proposal for Acme Corp',
        documentType: 'QUOTE',
        documentTitle: 'Video Surveillance — Phase 2',
        quoteID: 'EA102-AL',
        revision: 2,
        quoteDate: '2026-04-19',
        validUntil: '2026-05-19',
        preparedFor: [{ name: 'Jane Doe' }, { name: 'Robert Martin' }],
        preparedBy: [{ name: 'John Smith' }],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'CoverBlock',
        clientLogo:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==',
        clientName: 'Acme Corporation',
        subtitle: 'Master Service Agreement for Acme Corp',
        documentType: 'MASTER SERVICE AGREEMENT',
        documentTitle: 'Multi-site Security Modernization',
        quoteID: 'EA102-AL',
        revision: 3,
        quoteDate: '2026-04-19',
        validUntil: '2026-06-18',
        preparedFor: [{ name: 'Jean-Claude Van Damme' }, { name: 'Robert Martin' }],
        preparedBy: [{ name: 'John Smith' }, { name: 'Alice Tremblay' }],
      },
    },
  ],
});
