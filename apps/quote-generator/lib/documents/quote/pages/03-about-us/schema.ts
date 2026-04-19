import { z } from 'zod';

export const aboutUsPageSchema = z.object({
  includeAboutUs: z.boolean().default(true),
});
