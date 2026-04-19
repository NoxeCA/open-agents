import type { z } from 'zod';
import type { tableOfContentsPageSchema } from './schema';

export type TableOfContentsPageData = z.infer<typeof tableOfContentsPageSchema>;
