import { z } from 'zod';

export const teamMemberSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  name: z.string().min(1, 'Name is required'),
  skills: z.array(z.string().min(1)),
  description: z.string().min(1, 'Description is required'),
});

export const teamPageSchema = z.object({
  includeTeam: z.boolean().default(true),
  team: z.array(teamMemberSchema).optional(),
});
