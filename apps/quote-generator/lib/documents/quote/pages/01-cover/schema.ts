import { z } from 'zod';
import { personRefSchema, dateFieldSchema } from '../../shared/schemas';

export const coverPageSchema = z.object({
  clientLogo: z.string().optional(),
  clientName: z.string().transform(val => val || undefined).optional(),
  subtitle: z.string().min(1, 'Subtitle is required'),
  documentType: z.string().min(1, 'Document type is required'),
  documentTitle: z.string().min(1, 'Document title is required'),
  quoteID: z.string().min(1, 'Quote ID is required'),
  revision: z.number().int().positive('Revision must be a positive integer'),
  quoteDate: dateFieldSchema,
  validUntil: dateFieldSchema,
  preparedFor: z.array(personRefSchema).min(1, 'At least one person required for Prepared For'),
  preparedBy: z.array(personRefSchema).min(1, 'At least one person required for Prepared By'),
});
