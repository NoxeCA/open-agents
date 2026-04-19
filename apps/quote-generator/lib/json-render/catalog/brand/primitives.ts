import { z } from 'zod';
import { defineComponent } from '../types';

export const darkHeaderBoxProps = z.object({
  eyebrow: z
    .string()
    .optional()
    .describe(
      'Small uppercase eyebrow label rendered above the title in brand.colors.cyan (e.g. a zero-padded section number like "01" or a category tag like "SECTION"). Omit for boxes that should show only the title.'
    ),
  title: z
    .string()
    .min(1)
    .describe(
      'Main title rendered in bold 14pt white on the dark background. Keep concise (under ~50 chars) so it does not wrap; longer content should move to `subtitle` or a separate Paragraph.'
    ),
  subtitle: z
    .string()
    .optional()
    .describe(
      'Optional supporting line rendered below the title in 10pt white at 75% opacity. Use for a short context line (e.g. "Priced section" or a date range); omit when the title stands alone.'
    ),
});

export const sectionHeaderProps = z.object({
  number: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe(
      'Optional leading section number rendered in large 32pt gray and zero-padded to 2 digits (e.g. 1 -> "01", 10 -> "10"). Omit to render just the section name with no numeric prefix.'
    ),
  name: z
    .string()
    .min(1)
    .describe(
      'Section title text rendered in bold 20pt dark next to the number. Keep short (under ~40 chars) to avoid wrapping; use Paragraph for descriptive body text that follows this header.'
    ),
});

export const DarkHeaderBox = defineComponent({
  name: 'DarkHeaderBox',
  kind: 'leaf',
  category: 'brand',
  props: darkHeaderBoxProps,
  description:
    'Dark rounded header card used on service/BOM tables and other branded callouts. Renders an optional cyan eyebrow, a bold white title, and an optional faded white subtitle on brand.colors.dark. Use on BOM/service sections or when presenting a single-line hero fact. Don\'t use as a page-level heading (use Heading or SectionHeader) and don\'t use as a generic card (use Box).',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'DarkHeaderBox', title: 'Section 01' },
    },
    {
      label: 'full',
      spec: {
        type: 'DarkHeaderBox',
        eyebrow: '01',
        title: 'Video Surveillance',
        subtitle: 'Priced section — 2 pages',
      },
    },
  ],
});

export const SectionHeader = defineComponent({
  name: 'SectionHeader',
  kind: 'leaf',
  category: 'brand',
  props: sectionHeaderProps,
  description:
    'Large "NN Section Name" header with optional zero-padded number, used to anchor a numbered section inside a Page (e.g. "01 About Us"). Use as the top element of each numbered content page. Don\'t use for page titles without a number — use Heading level 1 — and don\'t use inside a ServiceSection (it emits its own header row).',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'SectionHeader', name: 'About Us' },
    },
    {
      label: 'full',
      spec: { type: 'SectionHeader', number: 1, name: 'About Us' },
    },
  ],
});
