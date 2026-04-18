import { z } from 'zod';

export const ceoMessagePageSchema = z.object({
  includeCeoMessage: z.boolean().default(true),
  ceo: z.object({
    message: z.string().min(1),
    values: z.tuple([z.string(), z.string(), z.string()]),
  }).optional(),
});
