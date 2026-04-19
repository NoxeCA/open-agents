import type { z } from 'zod';
import type { ceoMessagePageSchema } from './schema';

export type CeoMessagePageData = z.infer<typeof ceoMessagePageSchema>;
