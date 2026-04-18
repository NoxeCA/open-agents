import { z } from 'zod';

export const termsAndConditionsPageSchema = z.object({
  includeTermsAndConditions: z.boolean().default(true),
});
