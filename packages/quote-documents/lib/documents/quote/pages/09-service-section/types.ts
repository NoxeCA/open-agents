import type { z } from 'zod';
import type { bomItemSchema, laborItemSchema, serviceSectionSchema, serviceSectionPageSchema } from './schema';

export type BomItem = z.infer<typeof bomItemSchema>;
export type LaborItem = z.infer<typeof laborItemSchema>;
export type ServiceSection = z.infer<typeof serviceSectionSchema>;
export type ServiceSectionPageData = z.infer<typeof serviceSectionPageSchema>;
