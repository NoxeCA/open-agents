import { z } from 'zod';

export const exclusionsConditionsPageSchema = z.object({
  exclusions: z.array(z.string()),
  specialConditions: z.array(z.string()),
  notes: z.array(z.string()),
  paymentTerms: z.array(z.string()),
  contactInfo: z.object({
    name: z.string().min(1),
    company: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email('Invalid email address'),
  }),
});
