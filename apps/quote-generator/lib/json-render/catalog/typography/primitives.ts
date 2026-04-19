import { z } from 'zod';
import { defineComponent } from '../types';

const colorProp = z
  .string()
  .optional()
  .describe(
    'Text color override as hex (e.g. "#00B8D4") or rgba. Omit to fall back to the brand palette default (dark for most primitives, gray for muted/caption). Use brand.colors.cyan for accent text inside a DarkHeaderBox.'
  );

export const headingProps = z.object({
  text: z
    .string()
    .min(1)
    .describe(
      'Heading text content. Plain string, no markdown. Keep under ~60 chars to avoid wrapping onto three lines on Letter paper; longer titles should be split into Subheading + Paragraph.'
    ),
  level: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .default(1)
    .describe(
      'Heading size tier: 1 = 32pt (page titles like "About Us"), 2 = 24pt (major subsection titles), 3 = 20pt (sub-subsection titles). Defaults to 1; pick 2 when a page already has a SectionHeader acting as the H1.'
    ),
  color: colorProp,
  align: z
    .enum(['left', 'center', 'right'])
    .default('left')
    .describe(
      'Horizontal text alignment within the heading\'s container width. Defaults to "left" (brand standard); use "center" only for decorative standalone titles like an attestation page.'
    ),
});

export const subheadingProps = z.object({
  text: z
    .string()
    .min(1)
    .describe(
      'Subheading text content. Plain string, no markdown. Use for lead-in titles above Paragraphs (e.g. "Why Noxe?"); keep shorter than the associated Heading.'
    ),
  color: colorProp,
});

export const paragraphProps = z.object({
  text: z
    .string()
    .min(1)
    .describe(
      'Paragraph body text. Plain string — newlines are preserved as line breaks. Use \\n\\n for a logical paragraph break; for a bulleted list prefer BulletList over manual dashes.'
    ),
  muted: z
    .boolean()
    .default(false)
    .describe(
      'When true, renders the text in brand.colors.gray for secondary/supporting copy (e.g. a descriptive line under a section header). Defaults to false. Mutually exclusive with an explicit `color` or `size` override in practice — pick one styling path.'
    ),
  align: z
    .enum(['left', 'center', 'right', 'justify'])
    .default('left')
    .describe(
      'Horizontal text alignment. Defaults to "left"; use "justify" for long legal/terms blocks that span the full page width.'
    ),
  size: z
    .number()
    .positive()
    .optional()
    .describe(
      'Override font size in points (pts). Omit to use the brand body size (~10pt). Use 11-12pt for emphasized lead paragraphs immediately under a Heading.'
    ),
});

export const labelProps = z.object({
  text: z
    .string()
    .min(1)
    .describe(
      'Label text. Plain string. Use for field labels in info grids ("Quote Number"), badges, and other short metadata. Long strings should be a Paragraph instead.'
    ),
  uppercase: z
    .boolean()
    .default(false)
    .describe(
      'When true, uppercases the label at render time via textTransform (the source string is kept as-is). Use true for eyebrow labels / column headers; defaults to false.'
    ),
  color: colorProp,
});

export const captionProps = z.object({
  text: z
    .string()
    .min(1)
    .describe(
      'Caption text. Plain string. Use for fine-print like figure captions, date footers, and legal disclaimers under pricing tables. Multi-line allowed but keep short.'
    ),
  color: colorProp,
});

export const Heading = defineComponent({
  name: 'Heading',
  kind: 'leaf',
  category: 'typography',
  props: headingProps,
  description:
    'Page or subsection heading with three discrete size tiers (32/24/20pt). Use level 1 for a page title like "About Us"; use level 2/3 inside a page that already has a SectionHeader or another H1. Don\'t use for small emphatic labels — use Label with uppercase — and don\'t use for decorative callouts — use DarkHeaderBox.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Heading', text: 'About Us' },
    },
    {
      label: 'full',
      spec: {
        type: 'Heading',
        text: 'Scope of Work',
        level: 2,
        color: '#0E141B',
        align: 'left',
      },
    },
  ],
});

export const Subheading = defineComponent({
  name: 'Subheading',
  kind: 'leaf',
  category: 'typography',
  props: subheadingProps,
  description:
    'Mid-weight heading for subsections inside a Page or Section that already owns the top-level Heading. Use for "Why Noxe?" / "Our Approach" lead-ins above Paragraph copy. Don\'t use when a Heading level 2/3 would do; don\'t use for uppercase eyebrow labels — use Label with uppercase instead.',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Subheading', text: 'Our Approach' },
    },
    {
      label: 'full',
      spec: { type: 'Subheading', text: 'Why Noxe?', color: '#00B8D4' },
    },
  ],
});

export const Paragraph = defineComponent({
  name: 'Paragraph',
  kind: 'leaf',
  category: 'typography',
  props: paragraphProps,
  description:
    'Body paragraph — the default text primitive for multi-sentence copy. Use for the body of About Us, Scope descriptions, and any flowing prose. Don\'t use for bulleted enumerations (use BulletList) and don\'t use for short metadata labels (use Label or Caption).',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Paragraph', text: 'Noxe designs and installs smart building systems.' },
    },
    {
      label: 'full',
      spec: {
        type: 'Paragraph',
        text: 'This proposal outlines the full scope of work.',
        muted: true,
        align: 'justify',
        size: 11,
      },
    },
  ],
});

export const Label = defineComponent({
  name: 'Label',
  kind: 'leaf',
  category: 'typography',
  props: labelProps,
  description:
    'Small label for field names, eyebrow labels, and other short metadata (e.g. "Quote Number", "Prepared For"). Use inside info grids and next to a value. Don\'t use for multi-sentence copy (use Paragraph) and don\'t use for hero titles (use Heading).',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Label', text: 'Quote Number' },
    },
    {
      label: 'full',
      spec: {
        type: 'Label',
        text: 'Prepared For',
        uppercase: true,
        color: '#8A909A',
      },
    },
  ],
});

export const Caption = defineComponent({
  name: 'Caption',
  kind: 'leaf',
  category: 'typography',
  props: captionProps,
  description:
    'Fine-print text for footnotes, figure captions, and legal disclaimers (e.g. tax disclaimer under a pricing table). Uses the smallest body size in the brand scale. Don\'t use as the primary copy on a page (use Paragraph) and don\'t use for field labels (use Label).',
  examples: [
    {
      label: 'minimal',
      spec: { type: 'Caption', text: 'Prices exclude applicable taxes.' },
    },
    {
      label: 'full',
      spec: {
        type: 'Caption',
        text: 'Figure 1: system architecture overview.',
        color: '#8A909A',
      },
    },
  ],
});
