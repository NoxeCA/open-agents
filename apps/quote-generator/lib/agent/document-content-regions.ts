import { quoteDocumentRegionIdSchema } from "@open-harness/quote-documents";

import type { QuoteData } from "@/lib/quote/schema";

export const documentContentRegionsBasePath = "/documentContent/regions";

export type ProposalDocumentContentRegionId = "proposal:body";
export type SummaryDocumentContentRegionSlot =
  | "before-table"
  | "after-table"
  | "after-total"
  | "after-tax";
export type SummaryDocumentContentRegionId =
  `summary:${SummaryDocumentContentRegionSlot}`;
export type ServiceDocumentContentRegionSlot =
  | "overview"
  | "before-table"
  | "after-table"
  | "after-tax";
export type CommercialDocumentContentRegionSlot =
  | "after-exclusions"
  | "after-special-conditions"
  | "after-notes"
  | "after-payment-terms"
  | "after-info";
export type CommercialDocumentContentRegionId =
  `commercial:${CommercialDocumentContentRegionSlot}`;
export type TermsDocumentContentRegionSlot =
  | "before-sections"
  | "after-sections";
export type TermsDocumentContentRegionId =
  `terms:${TermsDocumentContentRegionSlot}`;
export type OptionalPageDocumentContentRegionId = `optional:${number}:body`;
export type ServiceDocumentContentRegionId =
  `service:${number}:${ServiceDocumentContentRegionSlot}`;
export type DocumentContentRegionId =
  | ProposalDocumentContentRegionId
  | SummaryDocumentContentRegionId
  | ServiceDocumentContentRegionId
  | CommercialDocumentContentRegionId
  | TermsDocumentContentRegionId
  | OptionalPageDocumentContentRegionId;

export function buildProposalDocumentContentRegionId(): ProposalDocumentContentRegionId {
  return "proposal:body";
}

export function buildSummaryDocumentContentRegionId(
  slot: SummaryDocumentContentRegionSlot,
): SummaryDocumentContentRegionId {
  return `summary:${slot}`;
}

export function buildServiceDocumentContentRegionId(
  index: number,
  slot: ServiceDocumentContentRegionSlot,
): ServiceDocumentContentRegionId {
  return `service:${index}:${slot}`;
}

export function buildCommercialDocumentContentRegionId(
  slot: CommercialDocumentContentRegionSlot,
): CommercialDocumentContentRegionId {
  return `commercial:${slot}`;
}

export function buildTermsDocumentContentRegionId(
  slot: TermsDocumentContentRegionSlot,
): TermsDocumentContentRegionId {
  return `terms:${slot}`;
}

export function buildOptionalPageDocumentContentRegionId(
  index: number,
): OptionalPageDocumentContentRegionId {
  return `optional:${index}:body`;
}

export function buildDocumentContentBlocksPath(regionId: string) {
  return `${documentContentRegionsBasePath}/${regionId}/blocks`;
}

export function resolveDocumentContentPatchPath(
  data: Partial<QuoteData>,
  path: string,
) {
  if (!path.startsWith(`${documentContentRegionsBasePath}/`)) {
    return path;
  }

  const remainder = path.slice(documentContentRegionsBasePath.length + 1);
  const blocksIndex = remainder.indexOf("/blocks");

  if (blocksIndex === -1) {
    throw new Error(
      `Unsupported documentContent region path: ${path}. Expected /documentContent/regions/<region-id>/blocks.`,
    );
  }

  const regionId = remainder.slice(0, blocksIndex);
  const parsedRegionId = quoteDocumentRegionIdSchema.safeParse(regionId);
  const regions = data.documentContent?.regions ?? {};

  if (!parsedRegionId.success) {
    throw new Error(
      `Invalid documentContent region "${regionId}". Use stable ids such as service:0:after-tax.`,
    );
  }

  if (!(regionId in regions)) {
    throw new Error(
      `Unknown documentContent region "${regionId}". Use a region listed in quote_state.rendererMap.`,
    );
  }

  return path;
}
