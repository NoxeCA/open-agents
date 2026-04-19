import { z } from 'zod';
import { attachedDocumentSchema } from '@/lib/documents/quote/shared/schemas';
import { brandConfigOverrideSchema } from '../brand/schema';
import { pageProps } from '../catalog/layout/Page';
import {
  hstackProps,
  vstackProps,
  sectionProps,
  spacerProps,
  dividerProps,
  boxProps,
} from '../catalog/layout/primitives';
import {
  headingProps,
  subheadingProps,
  paragraphProps,
  labelProps,
  captionProps,
} from '../catalog/typography/primitives';
import { darkHeaderBoxProps, sectionHeaderProps } from '../catalog/brand/primitives';
import { tocEntriesProps } from '../catalog/brand/TocEntries';
import { imageProps, bulletListProps, valuePillGridProps } from '../catalog/content/primitives';
import { coverBlockProps } from '../catalog/composites/CoverBlock';
import {
  taxDisclaimerProps,
  totalCostBoxProps,
  summaryTableProps,
  infoGridProps,
  signatureBlockProps,
  continuationHeaderProps,
  teamCardProps,
  partnerGridProps,
} from '../catalog/composites/primitives';
import {
  bomTableProps,
  laborBlockProps,
  serviceSectionProps,
} from '../catalog/tables/primitives';
import {
  calloutProps,
  keyValueTableProps,
  metricProps,
  metricGridProps,
  priceComparisonProps,
  ceoMessageCardProps,
  termsAndConditionsProps,
  keepTogetherProps,
  linkProps,
  pageNumberProps,
  tableProps,
  richTextProps,
} from '../catalog/atoms/primitives';

// Recursive content-node union. `children` references itself lazily so
// containers (VStack, HStack, Section, Box) can nest arbitrarily.
export type SpecContentNode = { type: string; children?: SpecContentNode[] } & Record<string, unknown>;

const leaf = <T extends z.ZodObject<any>>(type: string, shape: T) =>
  shape.extend({ type: z.literal(type) });

const container = <T extends z.ZodObject<any>>(type: string, shape: T) =>
  shape.extend({
    type: z.literal(type),
    children: z.array(z.lazy(() => specContentNodeSchema)).min(1),
  });

const coverBlockNode = leaf('CoverBlock', coverBlockProps);
const taxDisclaimerNode = leaf('TaxDisclaimer', taxDisclaimerProps);
const totalCostBoxNode = leaf('TotalCostBox', totalCostBoxProps);
const summaryTableNode = leaf('SummaryTable', summaryTableProps);
const infoGridNode = leaf('InfoGrid', infoGridProps);
const signatureBlockNode = leaf('SignatureBlock', signatureBlockProps);
const continuationHeaderNode = leaf('ContinuationHeader', continuationHeaderProps);
const teamCardNode = leaf('TeamCard', teamCardProps);
const partnerGridNode = leaf('PartnerGrid', partnerGridProps);
const bomTableNode = leaf('BomTable', bomTableProps);
const laborBlockNode = leaf('LaborBlock', laborBlockProps);
const serviceSectionNode = leaf('ServiceSection', serviceSectionProps);
const headingNode = leaf('Heading', headingProps);
const subheadingNode = leaf('Subheading', subheadingProps);
const paragraphNode = leaf('Paragraph', paragraphProps);
const labelNode = leaf('Label', labelProps);
const captionNode = leaf('Caption', captionProps);
const spacerNode = leaf('Spacer', spacerProps);
const dividerNode = leaf('Divider', dividerProps);
const imageNode = leaf('Image', imageProps);
const bulletListNode = leaf('BulletList', bulletListProps);
const valuePillGridNode = leaf('ValuePillGrid', valuePillGridProps);
const darkHeaderBoxNode = leaf('DarkHeaderBox', darkHeaderBoxProps);
const sectionHeaderNode = leaf('SectionHeader', sectionHeaderProps);
const tocEntriesNode = leaf('TocEntries', tocEntriesProps);

const hstackNode = container('HStack', hstackProps);
const vstackNode = container('VStack', vstackProps);
const sectionNode = container('Section', sectionProps);
const boxNode = container('Box', boxProps);
const keepTogetherNode = container('KeepTogether', keepTogetherProps);

const calloutNode = leaf('Callout', calloutProps);
const keyValueTableNode = leaf('KeyValueTable', keyValueTableProps);
const metricNode = leaf('Metric', metricProps);
const metricGridNode = leaf('MetricGrid', metricGridProps);
const priceComparisonNode = leaf('PriceComparison', priceComparisonProps);
const ceoMessageCardNode = leaf('CeoMessageCard', ceoMessageCardProps);
const termsAndConditionsNode = leaf('TermsAndConditions', termsAndConditionsProps);
const linkNode = leaf('Link', linkProps);
const pageNumberNode = leaf('PageNumber', pageNumberProps);
const tableNode = leaf('Table', tableProps);
const richTextNode = leaf('RichText', richTextProps);

export const specContentNodeSchema: z.ZodType<SpecContentNode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    coverBlockNode,
    headingNode,
    subheadingNode,
    paragraphNode,
    labelNode,
    captionNode,
    spacerNode,
    dividerNode,
    imageNode,
    bulletListNode,
    valuePillGridNode,
    darkHeaderBoxNode,
    sectionHeaderNode,
    tocEntriesNode,
    taxDisclaimerNode,
    totalCostBoxNode,
    summaryTableNode,
    infoGridNode,
    signatureBlockNode,
    continuationHeaderNode,
    teamCardNode,
    partnerGridNode,
    bomTableNode,
    laborBlockNode,
    hstackNode,
    vstackNode,
    sectionNode,
    boxNode,
    keepTogetherNode,
    calloutNode,
    keyValueTableNode,
    metricNode,
    metricGridNode,
    priceComparisonNode,
    ceoMessageCardNode,
    termsAndConditionsNode,
    linkNode,
    pageNumberNode,
    tableNode,
    richTextNode,
  ])
) as unknown as z.ZodType<SpecContentNode>;

const pageNode = pageProps.extend({
  type: z.literal('Page'),
  children: z.array(specContentNodeSchema).min(1),
});

const documentChildNode = z.discriminatedUnion('type', [pageNode, serviceSectionNode]);

// Loose envelope accepted on the wire. The document tree is opaque here —
// it may contain $repeat / $cond nodes that the binding resolver expands
// before strict validation runs.
export const specEnvelopeSchema = z.object({
  version: z.literal(1),
  brand: brandConfigOverrideSchema.optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(attachedDocumentSchema).optional(),
  document: z.object({
    type: z.literal('Document'),
    lang: z.enum(['fr', 'en']).default('fr'),
    children: z.array(z.unknown()).min(1),
  }),
});

// Strict schema applied after bindings have been resolved.
export const specDocumentSchema = z.object({
  version: z.literal(1),
  brand: brandConfigOverrideSchema.optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(attachedDocumentSchema).optional(),
  document: z.object({
    type: z.literal('Document'),
    lang: z.enum(['fr', 'en']).default('fr'),
    children: z.array(documentChildNode).min(1),
  }),
});

export type SpecDocument = z.infer<typeof specDocumentSchema>;
export type SpecEnvelope = z.infer<typeof specEnvelopeSchema>;
export type SpecPageNode = z.infer<typeof pageNode>;
export type SpecDocumentChildNode = z.infer<typeof documentChildNode>;
export type SpecServiceSectionNode = z.infer<typeof serviceSectionNode>;
