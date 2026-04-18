import { z } from 'zod';

export const partnersPageSchema = z.object({
  includePartners: z.boolean().default(false),
});
