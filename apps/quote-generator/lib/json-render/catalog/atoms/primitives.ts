import { z } from 'zod';
import { defineComponent } from '../types';

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

const alignHorizontal = z
  .enum(['left', 'center', 'right'])
  .describe('Horizontal text alignment.');

// ---------------------------------------------------------------------------
// Callout
// ---------------------------------------------------------------------------

export const calloutProps = z.object({
  title: z
    .string()
    .min(1)
    .optional()
    .describe('Optional bold title rendered above the body text.'),
  text: z
    .string()
    .min(1)
    .describe('The body of the callout. A short sentence or two.'),
  variant: z
    .enum(['info', 'warning', 'accent', 'neutral'])
    .default('info')
    .describe(
      'Visual variant controlling the left-bar color: info = gray, warning = amber, accent = brand cyan, neutral = dark.'
    ),
  showIcon: z
    .boolean()
    .default(true)
    .describe('If true, shows the brand info icon next to the title.'),
});

export const Callout = defineComponent({
  name: 'Callout',
  kind: 'leaf',
  category: 'content',
  props: calloutProps,
  description:
    'A bordered rounded box with a colored left bar used to draw attention to a short note (tips, warnings, highlights). Use when you need visual emphasis inline with the flow of a page. Don\'t use for long multi-paragraph legal text; for that use TermsAndConditions. Don\'t use for final totals; for those use TotalCostBox.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Callout', text: 'Installation date to be confirmed.' },
    },
    {
      label: 'full',
      spec: {
        type: 'Callout',
        title: 'Important',
        text: 'A 30% deposit is required before work begins.',
        variant: 'warning',
        showIcon: true,
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// KeyValueTable
// ---------------------------------------------------------------------------

export const keyValueTableProps = z.object({
  rows: z
    .array(
      z.object({
        label: z.string().min(1).describe('Left-column key (bolded).'),
        value: z.string().min(1).describe('Right-column value.'),
      })
    )
    .min(1)
    .describe('Ordered list of label/value pairs rendered as a definition list.'),
  columns: z
    .union([z.literal(1), z.literal(2)])
    .default(1)
    .describe('Number of key/value columns laid out side-by-side. Rows are distributed across columns top-to-bottom.'),
  labelWidthPercent: z
    .number()
    .min(10)
    .max(70)
    .default(30)
    .describe('Percentage width of the label column inside each key/value cell.'),
});

export const KeyValueTable = defineComponent({
  name: 'KeyValueTable',
  kind: 'leaf',
  category: 'content',
  props: keyValueTableProps,
  description:
    'Definition-list style label/value pairs. Use for client info, project metadata, spec sheets. Different from SummaryTable, which is for priced line items with currency formatting; KeyValueTable is for arbitrary text values and never formats money.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'KeyValueTable',
        rows: [
          { label: 'Client', value: 'Acme Inc.' },
          { label: 'Project', value: 'Video surveillance retrofit' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'KeyValueTable',
        columns: 2,
        labelWidthPercent: 40,
        rows: [
          { label: 'Client', value: 'Acme Inc.' },
          { label: 'Contact', value: 'Jane Doe' },
          { label: 'Project', value: 'Video surveillance retrofit' },
          { label: 'Start date', value: '2026-05-10' },
        ],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// Metric
// ---------------------------------------------------------------------------

export const metricProps = z.object({
  value: z
    .string()
    .min(1)
    .describe('The prominent headline number or short string, e.g. "42", "98%", "$12.5k".'),
  label: z
    .string()
    .min(1)
    .describe('Muted label explaining what the number represents.'),
  trend: z
    .string()
    .optional()
    .describe('Optional small trend line below the label, e.g. "+12% vs last year".'),
  align: alignHorizontal.default('left').describe('Alignment of the block contents.'),
});

export const Metric = defineComponent({
  name: 'Metric',
  kind: 'leaf',
  category: 'content',
  props: metricProps,
  description:
    'A single KPI/stat block with a huge number + label (+ optional trend). Use on dashboards, executive summaries, or stats pages. Different from TotalCostBox, which renders the final quote amount with currency formatting and a dark card; Metric is for arbitrary stats and accepts pre-formatted string values.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Metric', value: '42', label: 'Active cameras' },
    },
    {
      label: 'full',
      spec: {
        type: 'Metric',
        value: '99.9%',
        label: 'Uptime',
        trend: '+0.1% vs last quarter',
        align: 'center',
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// MetricGrid
// ---------------------------------------------------------------------------

export const metricGridProps = z.object({
  items: z
    .array(
      z.object({
        value: z.string().min(1).describe('Headline number/string.'),
        label: z.string().min(1).describe('Muted explanation.'),
        trend: z.string().optional().describe('Optional small trend line.'),
      })
    )
    .min(1)
    .describe('List of metrics to render in the grid.'),
  columns: z
    .union([z.literal(2), z.literal(3), z.literal(4)])
    .default(3)
    .describe('Number of metrics per row.'),
});

export const MetricGrid = defineComponent({
  name: 'MetricGrid',
  kind: 'leaf',
  category: 'content',
  props: metricGridProps,
  description:
    'A grid of Metric blocks for displaying multiple KPIs together. Use for executive summary pages. Don\'t use for priced line items; for those use SummaryTable. Don\'t use for a single standalone stat; use Metric directly.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'MetricGrid',
        items: [
          { value: '42', label: 'Cameras' },
          { value: '12', label: 'Sites' },
          { value: '99.9%', label: 'Uptime' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'MetricGrid',
        columns: 4,
        items: [
          { value: '42', label: 'Cameras', trend: '+4 vs last year' },
          { value: '12', label: 'Sites', trend: 'Stable' },
          { value: '99.9%', label: 'Uptime', trend: '+0.1%' },
          { value: '3.2s', label: 'Avg response', trend: '-0.4s' },
        ],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// PriceComparison
// ---------------------------------------------------------------------------

export const priceComparisonProps = z.object({
  options: z
    .array(
      z.object({
        title: z.string().min(1).describe('Option name, e.g. "Standard", "Premium".'),
        price: z.number().nonnegative().describe('Price in dollars, formatted per brand language.'),
        features: z
          .array(z.string().min(1))
          .min(1)
          .describe('Bulleted feature list shown below the price.'),
        highlighted: z
          .boolean()
          .optional()
          .describe('If true, this card gets the cyan accent and a thicker border.'),
      })
    )
    .min(2)
    .max(4)
    .describe('Two to four plan/option cards displayed side-by-side.'),
});

export const PriceComparison = defineComponent({
  name: 'PriceComparison',
  kind: 'leaf',
  category: 'composite',
  props: priceComparisonProps,
  description:
    'Side-by-side option cards (e.g. Good / Better / Best) with a price and feature list per card. Use when you want to present tier choices to the client. Don\'t use for a single final total; for that use TotalCostBox. Don\'t use for priced line-item breakdowns; for that use SummaryTable.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'PriceComparison',
        options: [
          { title: 'Standard', price: 4999, features: ['8 cameras', 'Local NVR'] },
          { title: 'Premium', price: 7999, features: ['16 cameras', 'Cloud NVR'] },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'PriceComparison',
        options: [
          {
            title: 'Good',
            price: 4999,
            features: ['8 cameras', 'Local NVR', '1-year warranty'],
          },
          {
            title: 'Better',
            price: 7999,
            features: ['16 cameras', 'Cloud NVR', '3-year warranty'],
            highlighted: true,
          },
          {
            title: 'Best',
            price: 11999,
            features: ['32 cameras', 'Hybrid NVR', '5-year warranty', 'Priority support'],
          },
        ],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// CeoMessageCard
// ---------------------------------------------------------------------------

export const ceoMessageCardProps = z.object({
  name: z.string().min(1).describe('Person name, e.g. "Jane Doe".'),
  title: z
    .string()
    .min(1)
    .describe('Role line rendered above the name, typically uppercase (e.g. "CEO, NOXE INC.").'),
  message: z
    .string()
    .min(1)
    .describe('The message body. Supports newlines; a short paragraph works best.'),
  photo: z
    .string()
    .optional()
    .describe('Optional base64 data URI for the headshot. If omitted, no photo is rendered.'),
  pills: z
    .array(z.string().min(1))
    .default([])
    .describe('Short keyword pills rendered in a horizontal row below the message (e.g. values, accolades).'),
});

export const CeoMessageCard = defineComponent({
  name: 'CeoMessageCard',
  kind: 'leaf',
  category: 'composite',
  props: ceoMessageCardProps,
  description:
    'A personal message card with optional portrait on the left and a message body on the right, plus an optional row of pill-style keywords. Use for an executive intro on the quote cover or thank-you page. Don\'t use for a generic team listing; for that use TeamCard.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'CeoMessageCard',
        name: 'Jane Doe',
        title: 'CEO, NOXE INC.',
        message: 'Thank you for considering Noxe. We look forward to working with you.',
      },
    },
    {
      label: 'full',
      spec: {
        type: 'CeoMessageCard',
        name: 'Jane Doe',
        title: 'CEO, NOXE INC.',
        message:
          'Thank you for considering Noxe. Our team is committed to delivering a solution tailored to your needs, with long-term support you can rely on.',
        photo: 'data:image/jpeg;base64,REPLACE_ME',
        pills: ['Trust', 'Innovation', 'Craft', 'Support'],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// TermsAndConditions
// ---------------------------------------------------------------------------

export const termsAndConditionsProps = z.object({
  sections: z
    .array(
      z.object({
        title: z
          .string()
          .min(1)
          .describe('Section heading (e.g. "1. Payment", "2. Warranty").'),
        text: z.string().min(1).describe('Section body; may contain newlines.'),
      })
    )
    .min(1)
    .describe('Legal sections, rendered as heading + paragraph.'),
  columns: z
    .union([z.literal(1), z.literal(2)])
    .default(2)
    .describe('Single-column or two-column newspaper layout.'),
});

export const TermsAndConditions = defineComponent({
  name: 'TermsAndConditions',
  kind: 'leaf',
  category: 'composite',
  props: termsAndConditionsProps,
  description:
    'Legal section stack with small typography and optional two-column newspaper layout. Use for Terms & Conditions or warranty details. Don\'t use for a short one-line disclaimer; for that use TaxDisclaimer. Don\'t use for highlighted warnings; for that use Callout.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'TermsAndConditions',
        sections: [
          {
            title: '1. Payment',
            text: 'A 30% deposit is required before work begins. Balance due on completion.',
          },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'TermsAndConditions',
        columns: 2,
        sections: [
          {
            title: '1. Payment',
            text: 'A 30% deposit is required before work begins. Balance due on completion.',
          },
          {
            title: '2. Warranty',
            text: 'All installed equipment is covered by a 2-year parts and labor warranty.',
          },
          {
            title: '3. Cancellation',
            text: 'Orders may be cancelled within 7 days of signature for a full refund of the deposit.',
          },
          {
            title: '4. Limitation of liability',
            text: 'Noxe\'s liability is limited to the total amount paid under this agreement.',
          },
        ],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// KeepTogether
// ---------------------------------------------------------------------------

export const keepTogetherProps = z
  .object({})
  .describe('KeepTogether has no explicit props — its children are laid out inside a non-breaking View.');

export const KeepTogether = defineComponent({
  name: 'KeepTogether',
  kind: 'container',
  category: 'layout',
  props: keepTogetherProps,
  description:
    'Forces all children to render on a single page by wrapping them in a non-breaking View (react-pdf `wrap={false}`). Use for small groups that must not split across pages (a heading + its table, a signature block). Don\'t use for large content that exceeds one page; that will overflow silently. Don\'t use as a generic container for styling — use Section or Stack for that.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'KeepTogether',
        children: [
          { type: 'Subheading', text: 'Totals' },
          { type: 'TotalCostBox', amount: 12345 },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'KeepTogether',
        children: [
          { type: 'Subheading', text: 'Signatures' },
          {
            type: 'SignatureBlock',
            parties: [
              { label: 'Client Signature', nameLine: true, dateLine: true },
              { label: 'Noxe Representative', nameLine: true, dateLine: true },
            ],
          },
        ],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// Link
// ---------------------------------------------------------------------------

export const linkProps = z.object({
  text: z.string().min(1).describe('The visible text of the link.'),
  href: z
    .string()
    .min(1)
    .describe('Absolute URL or mailto: target. Relative URLs are not supported in PDFs.'),
  color: z
    .string()
    .optional()
    .describe('Hex/rgba override for the link color. Defaults to brand cyan.'),
});

export const Link = defineComponent({
  name: 'Link',
  kind: 'leaf',
  category: 'typography',
  props: linkProps,
  description:
    'Inline clickable hyperlink using react-pdf\'s Link. Use for URLs and mailto: targets. Don\'t use for internal page anchors — react-pdf does not support them reliably. Don\'t use for large clickable regions; wrap only the label text.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Link', text: 'noxe.com', href: 'https://noxe.com' },
    },
    {
      label: 'full',
      spec: {
        type: 'Link',
        text: 'Contact sales',
        href: 'mailto:sales@noxe.com',
        color: '#00AEEF',
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// PageNumber
// ---------------------------------------------------------------------------

export const pageNumberProps = z.object({
  format: z
    .string()
    .default('Page {current} of {total}')
    .describe('Template string. "{current}" is replaced with the current page number and "{total}" with the total page count.'),
});

export const PageNumber = defineComponent({
  name: 'PageNumber',
  kind: 'leaf',
  category: 'brand',
  props: pageNumberProps,
  description:
    'Inline page-of-total text suitable for headers or footers. Uses react-pdf\'s fixed render callback so it updates per page. Use inside a fixed header or footer. Don\'t use inside non-fixed content — the value will only reflect the first render. Don\'t use for section numbering; use a Label with static text.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'PageNumber' },
    },
    {
      label: 'full',
      spec: { type: 'PageNumber', format: '{current} / {total}' },
    },
  ],
});

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const tableProps = z.object({
  columns: z
    .array(
      z.object({
        header: z.string().min(1).describe('Column header text.'),
        align: z
          .enum(['left', 'center', 'right'])
          .optional()
          .describe('Horizontal alignment for both header and body cells in this column.'),
        width: z
          .string()
          .optional()
          .describe('Optional width (percent like "25%" or fixed points like "60pt"). Unset columns share remaining space equally.'),
      })
    )
    .min(1)
    .describe('Column definitions, left-to-right.'),
  rows: z
    .array(z.array(z.string()))
    .min(1)
    .describe('Body rows. Each row must have the same number of cells as there are columns.'),
  striped: z
    .boolean()
    .default(true)
    .describe('Alternating row background using brand.colors.rowAlt.'),
  compact: z
    .boolean()
    .default(false)
    .describe('Reduces vertical padding and font size for dense tables.'),
});

export const Table = defineComponent({
  name: 'Table',
  kind: 'leaf',
  category: 'table',
  props: tableProps,
  description:
    'Generic data table with a dark header row and optional striping. Use for arbitrary tabular data (specs, schedules). Different from SummaryTable, which is specialized for label+amount rows with currency formatting; Table accepts pre-formatted string cells and can have any number of columns.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'Table',
        columns: [{ header: 'Item' }, { header: 'Qty' }],
        rows: [
          ['Camera, 4K dome', '8'],
          ['NVR, 16-channel', '1'],
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'Table',
        striped: true,
        compact: false,
        columns: [
          { header: 'Item', align: 'left', width: '50%' },
          { header: 'Qty', align: 'center', width: '15%' },
          { header: 'Unit price', align: 'right', width: '17.5%' },
          { header: 'Total', align: 'right', width: '17.5%' },
        ],
        rows: [
          ['Camera, 4K dome', '8', '$299.00', '$2,392.00'],
          ['NVR, 16-channel', '1', '$1,499.00', '$1,499.00'],
          ['Cabling & labor', '1', '$1,108.00', '$1,108.00'],
        ],
      },
    },
  ],
});

// ---------------------------------------------------------------------------
// RichText
// ---------------------------------------------------------------------------

export const richTextProps = z.object({
  spans: z
    .array(
      z.object({
        text: z.string().min(1).describe('The text run.'),
        bold: z.boolean().optional().describe('If true, renders this run in 700 weight.'),
        color: z.string().optional().describe('Hex/rgba color override for this run.'),
      })
    )
    .min(1)
    .describe('Ordered inline runs. Rendered together inside a single Text block.'),
  align: z
    .enum(['left', 'center', 'right', 'justify'])
    .default('left')
    .describe('Paragraph alignment.'),
  size: z
    .number()
    .positive()
    .optional()
    .describe('Font size override in points. Defaults to body size.'),
});

export const RichText = defineComponent({
  name: 'RichText',
  kind: 'leaf',
  category: 'typography',
  props: richTextProps,
  description:
    'Paragraph with inline text runs that can be individually bolded or colored. Use when a single paragraph needs mixed emphasis (e.g. bolded amounts inside running copy). Don\'t use when the whole block is a single style — use Paragraph for that. Don\'t use for full Markdown; only bold + color are supported.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'RichText',
        spans: [
          { text: 'Deposit: ' },
          { text: '30%', bold: true },
          { text: ' of the total.' },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'RichText',
        align: 'justify',
        size: 10,
        spans: [
          { text: 'Warranty: ' },
          { text: '2 years', bold: true, color: '#00AEEF' },
          { text: ' parts and labor, extendable to ' },
          { text: '5 years', bold: true },
          { text: ' with an annual maintenance contract.' },
        ],
      },
    },
  ],
});
