import type { z } from 'zod';
import type { coverPageSchema } from './schema';

export type CoverPageData = z.infer<typeof coverPageSchema>;
