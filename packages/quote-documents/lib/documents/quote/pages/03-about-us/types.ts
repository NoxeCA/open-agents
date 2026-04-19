import type { z } from 'zod';
import type { aboutUsPageSchema } from './schema';

export type AboutUsPageData = z.infer<typeof aboutUsPageSchema>;
