import type { z } from 'zod';
import type { partnersPageSchema } from './schema';

export type PartnersPageData = z.infer<typeof partnersPageSchema>;
