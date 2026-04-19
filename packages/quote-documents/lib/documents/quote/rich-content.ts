import { z } from "zod";

export const quoteRichTextAlignSchema = z.enum(["left", "center", "right"]);

export const quoteRichHeadingBlockSchema = z.object({
  type: z.literal("heading"),
  text: z.string().min(1),
  level: z.enum(["h1", "h2", "h3"]).default("h2"),
  align: quoteRichTextAlignSchema.optional(),
});

export const quoteRichParagraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  text: z.string().min(1),
  tone: z.enum(["body", "muted", "lead"]).default("body"),
  align: quoteRichTextAlignSchema.optional(),
});

export const quoteRichQuoteBlockSchema = z.object({
  type: z.literal("quote"),
  text: z.string().min(1),
  attribution: z.string().min(1).optional(),
});

export const quoteRichListBlockSchema = z.object({
  type: z.literal("list"),
  title: z.string().min(1).optional(),
  items: z.array(z.string().min(1)).min(1),
  ordered: z.boolean().default(false),
});

export const quoteRichTableColumnSchema = z.object({
  label: z.string().min(1),
  align: quoteRichTextAlignSchema.optional(),
  weight: z.number().positive().optional(),
});

export const quoteRichTableBlockSchema = z.object({
  type: z.literal("table"),
  title: z.string().min(1).optional(),
  caption: z.string().min(1).optional(),
  columns: z.array(quoteRichTableColumnSchema).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

export const quoteRichImageBlockSchema = z.object({
  type: z.literal("image"),
  src: z.string().min(1),
  caption: z.string().min(1).optional(),
  widthPercent: z.number().positive().max(100).default(100),
  align: quoteRichTextAlignSchema.optional(),
});

export const quoteRichStatItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const quoteRichStatsBlockSchema = z.object({
  type: z.literal("stats"),
  title: z.string().min(1).optional(),
  items: z.array(quoteRichStatItemSchema).min(1),
});

export const quoteRichDividerBlockSchema = z.object({
  type: z.literal("divider"),
});

export const quoteRichSpacerBlockSchema = z.object({
  type: z.literal("spacer"),
  height: z.number().positive().max(160).default(16),
});

export const quoteRichContentBlockSchema = z.discriminatedUnion("type", [
  quoteRichHeadingBlockSchema,
  quoteRichParagraphBlockSchema,
  quoteRichQuoteBlockSchema,
  quoteRichListBlockSchema,
  quoteRichTableBlockSchema,
  quoteRichImageBlockSchema,
  quoteRichStatsBlockSchema,
  quoteRichDividerBlockSchema,
  quoteRichSpacerBlockSchema,
]);

export const quoteRichContentBlocksSchema = z
  .array(quoteRichContentBlockSchema)
  .min(1);

export type QuoteRichContentBlock = z.infer<typeof quoteRichContentBlockSchema>;
export type QuoteRichContentBlocks = z.infer<
  typeof quoteRichContentBlocksSchema
>;
