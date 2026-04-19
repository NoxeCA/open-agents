import type { z } from 'zod';
import type { teamMemberSchema, teamPageSchema } from './schema';

export type TeamMember = z.infer<typeof teamMemberSchema>;
export type TeamPageData = z.infer<typeof teamPageSchema>;
