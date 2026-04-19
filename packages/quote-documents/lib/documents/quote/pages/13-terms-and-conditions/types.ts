import type { z } from 'zod';
import type { termsAndConditionsPageSchema } from './schema';

export type TermsAndConditionsPageData = z.infer<typeof termsAndConditionsPageSchema>;
