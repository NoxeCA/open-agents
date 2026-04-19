import type { z } from 'zod';
import type { exclusionsConditionsPageSchema } from './schema';

export type ExclusionsConditionsPageData = z.infer<typeof exclusionsConditionsPageSchema>;
