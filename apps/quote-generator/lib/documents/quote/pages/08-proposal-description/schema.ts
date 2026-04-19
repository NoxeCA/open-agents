import { z } from "zod";

import { quoteRichContentBlocksSchema } from "../../rich-content";
import { dateFieldSchema } from "../../shared/schemas";

export const proposalDescriptionPageSchema = z.object({
  proposal: z.object({
    date: dateFieldSchema,
    addressee: z.object({
      name: z.string().min(1, "Addressee name is required"),
      company: z
        .string()
        .transform((val) => val || undefined)
        .optional(),
      address: z.string().min(1, "Addressee address is required"),
    }),
    object: z.string().min(1, "Object is required"),
    paragraphs: z.array(z.string().min(1)).default([]),
    blocks: quoteRichContentBlocksSchema.optional(),
  }),
});
