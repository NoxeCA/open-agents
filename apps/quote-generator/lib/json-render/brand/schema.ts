import { z } from 'zod';

// Brand overrides allowed via the spec envelope. Asset binaries are NEVER
// accepted — the spec only references assets by key. See env.ts.
export const brandConfigOverrideSchema = z.object({
  company: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    })
    .partial()
    .optional(),
  translations: z.enum(['fr', 'en']).optional(),
});

export type BrandConfigOverride = z.infer<typeof brandConfigOverrideSchema>;
