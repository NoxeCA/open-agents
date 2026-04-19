import type { z } from 'zod';
import type { proposalDescriptionPageSchema } from './schema';

export type ProposalDescriptionPageData = z.infer<typeof proposalDescriptionPageSchema>;
