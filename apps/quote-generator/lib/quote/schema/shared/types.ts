import type { z } from 'zod';
import type { personRefSchema, attachedDocumentSchema } from './schemas';

export type PersonRef = z.infer<typeof personRefSchema>;
export type AttachedDocument = z.infer<typeof attachedDocumentSchema>;
