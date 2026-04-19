import type { z } from 'zod';
import type { projectSummaryPageSchema } from './schema';

export type ProjectSummaryPageData = z.infer<typeof projectSummaryPageSchema>;
