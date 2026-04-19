import { z } from 'zod';
import {
  bomItemSchema,
  laborItemSchema,
  serviceSectionSchema,
} from '@/lib/documents/quote/pages/09-service-section/schema';
import { defineComponent } from '../types';

export const bomTableProps = z.object({
  layout: z
    .enum(['itemized-with-price', 'itemized-without-price'])
    .describe(
      'Column set for the BOM card. "itemized-with-price" shows qty/part/desc/oem + unit price + line total (used when the client is receiving priced detail); "itemized-without-price" hides pricing columns (used for scope-only BOMs where pricing is summarized elsewhere). Required — no default.'
    ),
  sectionName: z
    .string()
    .min(1)
    .describe(
      'Section name shown in the BOM card header ribbon (e.g. "Video Surveillance"). Typically mirrors the parent ServiceSection.sectionName so the BOM card reads as belonging to that section.'
    ),
  items: z
    .array(bomItemSchema)
    .min(1)
    .describe(
      'Ordered rows of the BOM — must be non-empty. Each item requires qty/partNumber/description/oem/unitPrice/total; extendedDescription is optional. Pricing columns only render when `layout` is "itemized-with-price", but unitPrice/total are still required by the schema.'
    ),
  subtotal: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Optional highlighted subtotal row appended after the last item (BOM subtotal in the document currency). Omit to skip the subtotal row, e.g. when this BomTable is one of several priced blocks whose subtotals roll up elsewhere.'
    ),
  repeatHeader: z
    .boolean()
    .default(true)
    .describe(
      'Whether the BOM card header ribbon and column header row should be re-rendered at the top of each overflow page. Leave true when this BomTable is the only BOM on its page. Set to false when placing multiple BomTables on one page to avoid fixed-header conflicts (react-pdf `fixed` headers would stack and collide).'
    ),
});

export const laborBlockProps = z.object({
  sectionName: z
    .string()
    .min(1)
    .describe(
      'Section name shown in the card header ribbon. Typically mirrors the parent section (e.g. ServiceSection.sectionName) so the labor card is clearly scoped.'
    ),
  items: z
    .array(laborItemSchema)
    .min(1)
    .describe(
      'Ordered rows of labor / other-service categories. Each item requires `category` (string) and `amount` (non-negative number) in the document currency. Must be non-empty.'
    ),
  subtotal: z
    .number()
    .nonnegative()
    .optional()
    .describe(
      'Optional highlighted subtotal row appended after the last item (labor subtotal in the document currency). Omit when this block is not the terminal costs block on its page.'
    ),
  title: z
    .string()
    .optional()
    .describe(
      'Override for the card title. Defaults to the brand translation (lang.service.laborAndServices, e.g. "Labor & Other Services"). Override when the block represents a different cost bucket (e.g. "Subcontractor Costs").'
    ),
});

export const serviceSectionProps = serviceSectionSchema.extend({
  projectTitle: z
    .string()
    .min(1)
    .describe(
      'Project title rendered at the top of every page this ServiceSection emits (e.g. "Video Surveillance — Phase 2"). Should match the document-wide project title; used as visual continuity across emitted pages.'
    ),
  projectIntro: z
    .string()
    .optional()
    .describe(
      'Optional project-level introduction paragraph rendered below projectTitle on the first emitted page. Set only on the first ServiceSection in the document when `showProjectIntro` is true; omit on subsequent sections.'
    ),
  showProjectIntro: z
    .boolean()
    .default(false)
    .describe(
      'When true, renders `projectIntro` below `projectTitle` on the section\'s intro page. Set true only on the first ServiceSection in the document so the intro appears exactly once; leave false for all subsequent sections.'
    ),
  sectionId: z
    .string()
    .optional()
    .describe(
      'Section identifier for TocEntries page resolution. Defaults to `service-<sectionNumber>` (e.g. sectionNumber 3 -> "service-3"). Override to give a TOC-friendly id (e.g. "video-surveillance"); the same string must appear in a TocEntries entry to be linkable.'
    ),
});

export type ServiceSectionProps = z.infer<typeof serviceSectionProps>;

export const BomTable = defineComponent({
  name: 'BomTable',
  kind: 'leaf',
  category: 'table',
  props: bomTableProps,
  description:
    'Bill of materials card with brand-styled column headers, data rows, and optional subtotal. Currency is formatted per brand language and the data rows overflow naturally across pages. Use standalone (on a BOM-only Page) or inside a ServiceSection. Don\'t use for labor/service costs — use LaborBlock — and don\'t use for plain enumerations — use BulletList.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'BomTable',
        layout: 'itemized-without-price',
        sectionName: 'Video Surveillance',
        items: [
          {
            qty: 2,
            partNumber: 'CAM-01',
            description: 'IP dome camera',
            oem: 'Axis',
            unitPrice: 0,
            total: 0,
          },
        ],
      },
    },
    {
      label: 'typical',
      spec: {
        type: 'BomTable',
        layout: 'itemized-with-price',
        sectionName: 'Video Surveillance',
        items: [
          {
            qty: 12,
            partNumber: 'CAM-01',
            description: 'IP dome camera 4MP',
            oem: 'Axis',
            unitPrice: 450,
            total: 5400,
          },
          {
            qty: 1,
            partNumber: 'NVR-32',
            description: '32-channel NVR',
            oem: 'Axis',
            unitPrice: 3200,
            total: 3200,
          },
        ],
        subtotal: 8600,
      },
    },
    {
      label: 'full',
      spec: {
        type: 'BomTable',
        layout: 'itemized-with-price',
        sectionName: 'Access Control',
        items: [
          {
            qty: 4,
            partNumber: 'READ-01',
            description: 'Prox card reader',
            extendedDescription: 'Wiegand output, mullion mount',
            oem: 'HID',
            unitPrice: 220,
            total: 880,
          },
        ],
        subtotal: 880,
        repeatHeader: false,
      },
    },
  ],
});

export const LaborBlock = defineComponent({
  name: 'LaborBlock',
  kind: 'leaf',
  category: 'table',
  props: laborBlockProps,
  description:
    'Card listing labor + other-service categories with amounts and an optional subtotal, using the OtherCosts table chrome. Use on priced pages that need to break out non-BOM costs (e.g. labor, commissioning, subcontractors). Don\'t use for parts/material lines (use BomTable) and don\'t use inside a ServiceSection of layout itemized-with-price — that layout already emits its own labor block from `laborCategories`.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'LaborBlock',
        sectionName: 'Video Surveillance',
        items: [{ category: 'Installation', amount: 1200 }],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'LaborBlock',
        sectionName: 'Video Surveillance',
        items: [
          { category: 'Installation', amount: 1200 },
          { category: 'Commissioning', amount: 600 },
          { category: 'Training', amount: 400 },
        ],
        subtotal: 2200,
        title: 'Labor & Services',
      },
    },
  ],
});

export const ServiceSection = defineComponent({
  name: 'ServiceSection',
  kind: 'leaf',
  category: 'composite',
  props: serviceSectionProps,
  description:
    'Document-level multi-page service section. Emits 1-3 react-pdf Pages based on `layout`: an intro page, an optional BOM page with auto-pagination + fixed header, and an Other Costs + Total page. `layout` values — "itemized-with-price": full intro + BOM + other-costs/total breakdown; "itemized-without-price": intro + BOM without pricing (totals rolled up); "zero-ventilation": intro + a dedicated ZeroVentilationTable page (used for the zero-vent service type). Place it inside `document.children`, alongside Page nodes, never INSIDE a Page.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'ServiceSection',
        projectTitle: 'Video Surveillance — Phase 2',
        sectionNumber: 1,
        sectionName: 'Video Surveillance',
        totalCost: 8600,
        layout: 'itemized-without-price',
        bomItems: [
          {
            qty: 2,
            partNumber: 'CAM-01',
            description: 'IP dome camera',
            oem: 'Axis',
            unitPrice: 0,
            total: 0,
          },
        ],
      },
    },
    {
      label: 'typical',
      spec: {
        type: 'ServiceSection',
        projectTitle: 'Video Surveillance — Phase 2',
        showProjectIntro: true,
        projectIntro: 'This project modernizes the camera infrastructure.',
        sectionNumber: 1,
        sectionName: 'Video Surveillance',
        description: 'Install and commission a 12-camera IP surveillance system.',
        totalCost: 10800,
        layout: 'itemized-with-price',
        bomItems: [
          {
            qty: 12,
            partNumber: 'CAM-01',
            description: 'IP dome camera 4MP',
            oem: 'Axis',
            unitPrice: 450,
            total: 5400,
          },
        ],
        bomSubtotal: 5400,
        laborCategories: [
          { category: 'Installation', amount: 3600 },
          { category: 'Commissioning', amount: 1800 },
        ],
        laborSubtotal: 5400,
      },
    },
    {
      label: 'full',
      spec: {
        type: 'ServiceSection',
        projectTitle: 'Video Surveillance — Phase 2',
        projectIntro: 'Full-scope modernization.',
        showProjectIntro: false,
        sectionId: 'video-surveillance',
        sectionNumber: 2,
        sectionName: 'Access Control',
        description: 'Upgrade card readers and controllers at 4 entry points.',
        totalCost: 4200,
        layout: 'itemized-with-price',
        bomItems: [
          {
            qty: 4,
            partNumber: 'READ-01',
            description: 'Prox card reader',
            extendedDescription: 'Wiegand output, mullion mount',
            oem: 'HID',
            unitPrice: 220,
            total: 880,
          },
        ],
        bomSubtotal: 880,
        laborCategories: [
          { category: 'Installation', amount: 2400 },
          { category: 'Programming', amount: 920 },
        ],
        laborSubtotal: 3320,
      },
    },
  ],
});
