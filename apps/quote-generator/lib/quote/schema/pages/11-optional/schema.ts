import { z } from 'zod';

export const optionalPageItemSchema = z.object({
  pageTitle: z.string().min(1, 'Page title is required'),
  title: z.string().min(1, 'Title is required'),
  text: z.string().min(1, 'Text is required'),
});

export const optionalPagesSchema = z.object({
  optionalPages: z.array(optionalPageItemSchema).optional(),
});
