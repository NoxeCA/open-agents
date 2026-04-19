import { z } from 'zod';
import { attachedDocumentsSchema } from './shared/schemas';
import { coverPageSchema } from './pages/01-cover/schema';
import { tableOfContentsPageSchema } from './pages/02-table-of-contents/schema';
import { aboutUsPageSchema } from './pages/03-about-us/schema';
import { culturePageSchema } from './pages/04-culture/schema';
import { ceoMessagePageSchema } from './pages/05-ceo-message/schema';
import { teamPageSchema } from './pages/06-team/schema';
import { partnersPageSchema } from './pages/07-partners/schema';
import { proposalDescriptionPageSchema } from './pages/08-proposal-description/schema';
import { serviceSectionPageSchema } from './pages/09-service-section/schema';
import { projectSummaryPageSchema } from './pages/10-project-summary/schema';
import { optionalPagesSchema } from './pages/11-optional/schema';
import { exclusionsConditionsPageSchema } from './pages/12-exclusions-conditions/schema';
import { termsAndConditionsPageSchema } from './pages/13-terms-and-conditions/schema';
import { quoteDocumentStateSchema } from "../document/catalog";

const metaSchema = z.object({
  lang: z.enum(['fr', 'en']).default('fr'),
});

export const quoteBusinessDataSchema = metaSchema
  .merge(coverPageSchema)
  .merge(tableOfContentsPageSchema)
  .merge(aboutUsPageSchema)
  .merge(culturePageSchema)
  .merge(ceoMessagePageSchema)
  .merge(teamPageSchema)
  .merge(partnersPageSchema)
  .merge(proposalDescriptionPageSchema)
  .merge(serviceSectionPageSchema)
  .merge(projectSummaryPageSchema)
  .merge(optionalPagesSchema)
  .merge(exclusionsConditionsPageSchema)
  .merge(termsAndConditionsPageSchema)
  .merge(attachedDocumentsSchema);

export type QuoteBusinessData = z.infer<typeof quoteBusinessDataSchema>;

export const quoteDataSchema = quoteBusinessDataSchema.extend({
  document: quoteDocumentStateSchema.optional(),
});

export type QuoteData = z.infer<typeof quoteDataSchema>;
