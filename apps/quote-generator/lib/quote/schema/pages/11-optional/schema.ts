import { quoteRichContentBlocksSchema } from "@/lib/documents/quote/rich-content";
import { z } from "zod";

export const optionalPageItemSchema = z.object({
  pageTitle: z.string().min(1, "Page title is required").optional(),
  title: z.string().min(1, "Title is required").optional(),
  text: z.string().min(1, "Text is required").optional(),
  blocks: quoteRichContentBlocksSchema.optional(),
});

export const optionalPagesSchema = z.object({
  optionalPages: z.array(optionalPageItemSchema).optional(),
});
