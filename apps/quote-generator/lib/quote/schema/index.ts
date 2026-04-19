import { z } from "zod";
import {
  buildQuoteDocumentRegionId,
  quoteDocumentContentSchema,
} from "./document-content";
import { attachedDocumentsSchema } from "./shared/schemas";
import { coverPageSchema } from "./pages/01-cover/schema";
import { tableOfContentsPageSchema } from "./pages/02-table-of-contents/schema";
import { aboutUsPageSchema } from "./pages/03-about-us/schema";
import { culturePageSchema } from "./pages/04-culture/schema";
import { ceoMessagePageSchema } from "./pages/05-ceo-message/schema";
import { teamPageSchema } from "./pages/06-team/schema";
import { partnersPageSchema } from "./pages/07-partners/schema";
import { proposalDescriptionPageSchema } from "./pages/08-proposal-description/schema";
import { serviceSectionPageSchema } from "./pages/09-service-section/schema";
import { projectSummaryPageSchema } from "./pages/10-project-summary/schema";
import { optionalPagesSchema } from "./pages/11-optional/schema";
import { exclusionsConditionsPageSchema } from "./pages/12-exclusions-conditions/schema";
import { termsAndConditionsPageSchema } from "./pages/13-terms-and-conditions/schema";
import { quoteDocumentStateSchema } from "../document/catalog";
import { quoteCompositionSchema } from "./composition";
import { quoteJsonRenderStateSchema } from "../../json-render/quote-spec-state";

const metaSchema = z.object({
  lang: z.enum(["fr", "en"]).default("fr"),
});

function hasDocumentContentRegionBlocks(
  documentContent: z.infer<typeof quoteDocumentContentSchema> | undefined,
  regionId: string,
) {
  const blocks = documentContent?.regions?.[regionId]?.blocks;
  return Array.isArray(blocks) && blocks.length > 0;
}

function validateDocumentContentBindings(
  quote: {
    proposal: { paragraphs: string[]; blocks?: unknown[] };
    optionalPages?: Array<{ text?: string; blocks?: unknown[] }>;
    documentContent?: z.infer<typeof quoteDocumentContentSchema>;
  },
  ctx: z.RefinementCtx,
) {
  const proposalRegionId = buildQuoteDocumentRegionId({
    scope: "proposal",
    anchor: "body",
  });

  if (
    quote.proposal.paragraphs.length === 0 &&
    !quote.proposal.blocks?.length &&
    !hasDocumentContentRegionBlocks(quote.documentContent, proposalRegionId)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "At least one paragraph, block, or document content region is required",
      path: ["proposal", "paragraphs"],
    });
  }

  for (const [index, page] of (quote.optionalPages ?? []).entries()) {
    const regionId = buildQuoteDocumentRegionId({
      scope: "optional",
      index,
      anchor: "body",
    });

    if (
      !page.text &&
      !page.blocks?.length &&
      !hasDocumentContentRegionBlocks(quote.documentContent, regionId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Optional pages need text, blocks, or a document content region",
        path: ["optionalPages", index, "text"],
      });
    }
  }
}

const quoteBusinessDataSchemaBase = metaSchema
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
  .merge(attachedDocumentsSchema)
  .extend({
    composition: quoteCompositionSchema.optional(),
    documentContent: quoteDocumentContentSchema.optional(),
    jsonRender: quoteJsonRenderStateSchema.optional(),
  });

export const quoteBusinessDataSchema = quoteBusinessDataSchemaBase.superRefine(
  validateDocumentContentBindings,
);

export type QuoteBusinessData = z.infer<typeof quoteBusinessDataSchema>;

const quoteDataSchemaBase = quoteBusinessDataSchemaBase.extend({
  document: quoteDocumentStateSchema.optional(),
  documentPlan: quoteCompositionSchema.optional(),
});

export const quoteDataSchema = quoteDataSchemaBase.superRefine(
  validateDocumentContentBindings,
);

export type QuoteData = z.infer<typeof quoteDataSchema>;

export type QuoteComposition = z.infer<typeof quoteCompositionSchema>;
export type QuoteDocumentContent = z.infer<typeof quoteDocumentContentSchema>;
export type QuoteJsonRenderState = z.infer<typeof quoteJsonRenderStateSchema>;

export { quoteCompositionSchema };
export { quoteDocumentContentSchema };
export { quoteJsonRenderStateSchema };
