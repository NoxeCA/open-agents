import { z } from 'zod';

export const culturePageSchema = z.object({
  includeCulture: z.boolean().default(false),
});
