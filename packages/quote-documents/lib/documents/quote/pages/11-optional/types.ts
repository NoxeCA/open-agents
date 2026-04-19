import type { z } from 'zod';
import type { optionalPageItemSchema, optionalPagesSchema } from './schema';

export type OptionalPageData = z.infer<typeof optionalPageItemSchema>;
export type OptionalPagesData = z.infer<typeof optionalPagesSchema>;
