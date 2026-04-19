import { z } from 'zod';

export const projectSummaryPageSchema = z.object({
  projectSummary: z.object({
    description: z.string(),
    subtotal: z.number().nonnegative(),
    totalProjectCost: z.number().nonnegative(),
  }),
});
