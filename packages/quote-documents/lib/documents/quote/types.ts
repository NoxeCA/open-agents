// Master types — re-exports from schema and all page types

// Main QuoteData type (from master schema)
export type { QuoteData } from "./schema";
export type {
  QuoteDocumentContent,
  QuoteDocumentContentRegion,
  QuoteDocumentRegionId,
  QuoteDocumentRegionScope,
  QuoteDocumentRegionTarget,
  QuoteDocumentRegions,
} from "./document-content";

// Shared types
export type { PersonRef, AttachedDocument } from "./shared/types";

// Page-specific types (ordered by PDF page sequence)
export type { CoverPageData } from "./pages/01-cover/types";
export type { TableOfContentsPageData } from "./pages/02-table-of-contents/types";
export type { AboutUsPageData } from "./pages/03-about-us/types";
export type { CulturePageData } from "./pages/04-culture/types";
export type { CeoMessagePageData } from "./pages/05-ceo-message/types";
export type { TeamMember, TeamPageData } from "./pages/06-team/types";
export type { PartnersPageData } from "./pages/07-partners/types";
export type { ProposalDescriptionPageData } from "./pages/08-proposal-description/types";
export type {
  BomItem,
  LaborItem,
  ServiceSection,
  ServiceSectionPageData,
} from "./pages/09-service-section/types";
export type { ProjectSummaryPageData } from "./pages/10-project-summary/types";
export type {
  OptionalPageData,
  OptionalPagesData,
} from "./pages/11-optional/types";
export type { ExclusionsConditionsPageData } from "./pages/12-exclusions-conditions/types";
export type { TermsAndConditionsPageData } from "./pages/13-terms-and-conditions/types";
