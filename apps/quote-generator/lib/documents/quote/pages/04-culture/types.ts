import type { z } from 'zod';
import type { culturePageSchema } from './schema';

export type CulturePageData = z.infer<typeof culturePageSchema>;
