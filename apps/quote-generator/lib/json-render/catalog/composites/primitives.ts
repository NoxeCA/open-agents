import { z } from 'zod';
import { defineComponent } from '../types';

export const taxDisclaimerProps = z.object({
  text: z.string().optional().describe('Override for the disclaimer text. Defaults to brand.translations.common.taxDisclaimer.'),
  showIcon: z.boolean().default(true).describe('Show the info icon from brand assets.'),
});

export const totalCostBoxProps = z.object({
  amount: z.number().nonnegative().describe('Total amount in cents-free dollars.'),
  label: z.string().optional().describe('Label prefix. Defaults to brand.translations.common.totalCost.'),
});

export const summaryTableProps = z.object({
  rows: z
    .array(
      z.object({
        label: z.string().min(1),
        amount: z.number().nonnegative(),
      })
    )
    .min(1)
    .describe('Rows of label + amount. Amounts formatted per brand language.'),
  subtotalLabel: z.string().optional().describe('Optional subtotal row label.'),
  subtotalAmount: z.number().nonnegative().optional(),
});

export const infoGridProps = z.object({
  rows: z
    .array(
      z.object({
        cells: z
          .array(
            z.object({
              label: z.string().min(1),
              values: z.array(z.string().min(1)).min(1),
            })
          )
          .min(2),
      })
    )
    .min(1)
    .describe('Grid rows of labeled cells. Cells within a row are equal-width with thin dividers.'),
  rowMinHeight: z.number().positive().optional(),
});

export const signatureBlockProps = z.object({
  parties: z
    .array(
      z.object({
        label: z.string().min(1).describe('e.g. "Client Signature".'),
        nameLine: z.boolean().default(true),
        dateLine: z.boolean().default(true),
      })
    )
    .min(1)
    .default([{ label: 'Client Signature', nameLine: true, dateLine: true }]),
});

export const continuationHeaderProps = z.object({
  text: z.string().min(1).describe('Text shown in the fixed header on continuation pages (e.g. "Proposal — Video Surveillance").'),
});

export const teamCardProps = z.object({
  members: z
    .array(
      z.object({
        role: z.string().min(1).describe('Role/title, e.g. "COO". Rendered as an uppercase eyebrow.'),
        name: z.string().min(1).describe('Full name.'),
        photo: z.string().optional().describe('Optional base64 data URI. Circular crop 64x64.'),
        experience: z.string().optional().describe('Short badge, e.g. "+99" for 99+ projects.'),
        skills: z
          .array(
            z.object({
              name: z.string().min(1).describe('Skill label, e.g. "Business Management".'),
              level: z.number().min(0).max(100).describe('Fill percentage 0-100.'),
            })
          )
          .max(5)
          .optional()
          .describe('Up to 5 skill bars per member.'),
        bio: z.string().optional().describe('Short bio paragraph.'),
      })
    )
    .min(1)
    .describe('Team members. Each card gets a photo, role, name, optional experience pill and up to 5 skill bars.'),
  columns: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .default(3)
    .describe('Grid columns.'),
});

export const partnerGridProps = z.object({
  partners: z
    .array(
      z.union([
        z.string().min(1).describe('Partner name text badge.'),
        z.object({
          name: z.string().min(1).describe('Partner name (used for text fallback and as alt label).'),
          logo: z.string().optional().describe('Optional base64 data URI. If provided, replaces the text badge.'),
        }),
      ])
    )
    .min(1)
    .describe('Partners. Mix strings and objects as needed.'),
  columns: z
    .union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)])
    .default(4)
    .describe('Grid columns. 3-6 columns; defaults to 4.'),
});

export const TaxDisclaimer = defineComponent({
  name: 'TaxDisclaimer',
  kind: 'leaf',
  category: 'composite',
  props: taxDisclaimerProps,
  description: 'Italic/small tax disclaimer row with optional info icon. Place after totals.',
});

export const TotalCostBox = defineComponent({
  name: 'TotalCostBox',
  kind: 'leaf',
  category: 'composite',
  props: totalCostBoxProps,
  description: 'Prominent cost box with left accent bar, label, and amount. Currency formatted per brand language.',
});

export const SummaryTable = defineComponent({
  name: 'SummaryTable',
  kind: 'leaf',
  category: 'composite',
  props: summaryTableProps,
  description: 'Compact rows table of label+amount with optional subtotal. Used on Project Summary pages.',
});

export const InfoGrid = defineComponent({
  name: 'InfoGrid',
  kind: 'leaf',
  category: 'composite',
  props: infoGridProps,
  description: 'Grid of labeled cells with vertical dividers (generalization of the cover-page info grid).',
});

export const SignatureBlock = defineComponent({
  name: 'SignatureBlock',
  kind: 'leaf',
  category: 'composite',
  props: signatureBlockProps,
  description: 'Signature + date lines for signed documents.',
});

export const ContinuationHeader = defineComponent({
  name: 'ContinuationHeader',
  kind: 'leaf',
  category: 'composite',
  props: continuationHeaderProps,
  description: 'Thin dark banner that repeats on every page of the enclosing Page (react-pdf `fixed`).',
});

export const TeamCard = defineComponent({
  name: 'TeamCard',
  kind: 'leaf',
  category: 'composite',
  props: teamCardProps,
  description:
    'Team-member grid with circular photo, uppercase role eyebrow, name, optional experience pill, optional skill bars, and short bio per card. Use on About/Team pages to introduce the delivery team behind a proposal, or on capability slides to show named expertise with visible skill levels. Don\'t use for client testimonials — use a Callout or Quote primitive instead.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'TeamCard',
        columns: 1,
        members: [
          {
            role: 'COO',
            name: 'Alex Rivera',
          },
        ],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'TeamCard',
        columns: 3,
        members: [
          {
            role: 'COO',
            name: 'Alex Rivera',
            photo: 'data:image/png;base64,PLACEHOLDER_ALEX',
            experience: '+99',
            skills: [
              { name: 'Business Management', level: 92 },
              { name: 'Operations', level: 85 },
              { name: 'Finance', level: 70 },
            ],
            bio: 'Leads operations and delivery across all active engagements.',
          },
          {
            role: 'CTO',
            name: 'Priya Patel',
            photo: 'data:image/png;base64,PLACEHOLDER_PRIYA',
            experience: '+50',
            skills: [
              { name: 'Systems Architecture', level: 95 },
              { name: 'Security', level: 80 },
              { name: 'DevOps', level: 75 },
            ],
            bio: 'Owns platform architecture and technical direction.',
          },
          {
            role: 'Head of Design',
            name: 'Marco Bianchi',
            photo: 'data:image/png;base64,PLACEHOLDER_MARCO',
            experience: '+30',
            skills: [
              { name: 'Product Design', level: 90 },
              { name: 'Design Systems', level: 85 },
            ],
            bio: 'Shapes the end-to-end design language of client deliverables.',
          },
        ],
      },
    },
  ],
});

export const PartnerGrid = defineComponent({
  name: 'PartnerGrid',
  kind: 'leaf',
  category: 'composite',
  props: partnerGridProps,
  description:
    'Grid of partner badges — either uppercase-name text badges or optional logo images — in a neutral card style with the Noxe palette. Use on "Our Partners" or ecosystem slides to list technology/channel partners behind a proposal. Mix strings and {name, logo} objects freely in one grid. Don\'t use for client logos; use Image in a HStack with gap.',
  examples: [
    {
      label: 'minimal',
      spec: {
        type: 'PartnerGrid',
        columns: 3,
        partners: ['Acme', 'Globex', 'Initech'],
      },
    },
    {
      label: 'full',
      spec: {
        type: 'PartnerGrid',
        columns: 4,
        partners: [
          'Acme',
          { name: 'Globex', logo: 'data:image/png;base64,PLACEHOLDER_GLOBEX' },
          { name: 'Initech' },
          { name: 'Umbrella', logo: 'data:image/png;base64,PLACEHOLDER_UMBRELLA' },
        ],
      },
    },
  ],
});
