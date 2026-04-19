import { quoteRichContentBlocksSchema } from "@/lib/documents/quote/rich-content";
import { z } from "zod";

export const bomItemSchema = z.object({
  qty: z.number().positive("Quantity must be positive"),
  partNumber: z.string().min(1, "Part number is required"),
  description: z.string().min(1, "Description is required"),
  extendedDescription: z
    .string()
    .transform((val) => val || undefined)
    .optional(),
  oem: z.string().min(1, "OEM is required"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  total: z.number().nonnegative("Total cannot be negative"),
});

export const laborItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().nonnegative("Amount cannot be negative"),
});

export const serviceSectionSchema = z.object({
  sectionNumber: z.number().int().positive(),
  sectionName: z.string().min(1, "Section name is required"),
  description: z.string().optional(),
  overviewBlocks: quoteRichContentBlocksSchema.optional(),
  bomItems: z.array(bomItemSchema).optional(),
  bomSubtotal: z.number().nonnegative().optional(),
  tableIntroBlocks: quoteRichContentBlocksSchema.optional(),
  laborCategories: z.array(laborItemSchema).optional(),
  laborSubtotal: z.number().nonnegative().optional(),
  tableOutroBlocks: quoteRichContentBlocksSchema.optional(),
  footerBlocks: quoteRichContentBlocksSchema.optional(),
  totalCost: z.number().nonnegative("Total cost cannot be negative"),
  layout: z.enum([
    "zero-ventilation",
    "itemized-without-price",
    "itemized-with-price",
  ]),
});

export const serviceSectionPageSchema = z.object({
  projectTitle: z.string().min(1, "Project title is required"),
  projectIntro: z.string().min(1, "Project intro is required"),
  services: z
    .array(serviceSectionSchema)
    .min(1, "At least one service section is required"),
});
