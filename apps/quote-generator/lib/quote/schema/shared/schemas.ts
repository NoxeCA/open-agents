import { z } from 'zod';

export const personRefSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const dateFieldSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Invalid date format, expected YYYY-MM-DD'
);

export const attachedDocumentSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  base64Content: z.string().min(1, 'Content is required'),
});

export const attachedDocumentsSchema = z.object({
  attachedDocuments: z.array(attachedDocumentSchema).optional(),
});
