import type {
  QuoteDocumentSectionKey,
  QuoteDocumentSectionVariant,
} from "./document-plan";
import { QUOTE_DOCUMENT_SECTION_KEYS } from "./document-plan";

export const QUOTE_DOCUMENT_SECTION_GROUPS = [
  "core",
  "story",
  "credibility",
  "scope",
  "commercial",
] as const;

export const QUOTE_DOCUMENT_LEGACY_FLAG_KEYS = [
  "includeAboutUs",
  "includeCulture",
  "includeCeoMessage",
  "includeTeam",
  "includePartners",
  "includeTermsAndConditions",
] as const;

export type QuoteDocumentSectionGroup =
  (typeof QUOTE_DOCUMENT_SECTION_GROUPS)[number];
export type QuoteDocumentLegacyFlagKey =
  (typeof QUOTE_DOCUMENT_LEGACY_FLAG_KEYS)[number];

export type QuoteDocumentSectionCatalogEntry = {
  key: QuoteDocumentSectionKey;
  title: string;
  description: string;
  group: QuoteDocumentSectionGroup;
  pageFile: string;
  defaultEnabled: boolean;
  allowDisable: boolean;
  variantSupport: readonly QuoteDocumentSectionVariant[];
  legacyFlag?: QuoteDocumentLegacyFlagKey;
  dataDependencies?: readonly string[];
};

export const quoteDocumentSectionCatalog = {
  cover: {
    key: "cover",
    title: "Cover",
    description:
      "Opening page with proposal identity, client references, and commercial framing.",
    group: "core",
    pageFile: "pages/01-cover/CoverPage.tsx",
    defaultEnabled: true,
    allowDisable: false,
    variantSupport: [],
  },
  "table-of-contents": {
    key: "table-of-contents",
    title: "Table of Contents",
    description:
      "Auto-numbered table of contents derived from the enabled legacy pages.",
    group: "core",
    pageFile: "pages/02-table-of-contents/TableOfContentsPage.tsx",
    defaultEnabled: true,
    allowDisable: false,
    variantSupport: [],
  },
  "about-us": {
    key: "about-us",
    title: "About Us",
    description:
      "Short company-introduction page used when the quote needs more Noxe story.",
    group: "story",
    pageFile: "pages/03-about-us/AboutUsPage.tsx",
    defaultEnabled: false,
    allowDisable: true,
    variantSupport: ["small", "standard", "detailed"],
    legacyFlag: "includeAboutUs",
  },
  culture: {
    key: "culture",
    title: "Culture",
    description:
      "Values and ways-of-working page that supports trust and service positioning.",
    group: "story",
    pageFile: "pages/04-culture/CulturePage.tsx",
    defaultEnabled: false,
    allowDisable: true,
    variantSupport: ["small", "standard", "detailed"],
    legacyFlag: "includeCulture",
  },
  "ceo-message": {
    key: "ceo-message",
    title: "CEO Message",
    description:
      "Leadership note that adds premium, relationship-led context to the proposal.",
    group: "story",
    pageFile: "pages/05-ceo-message/CeoMessagePage.tsx",
    defaultEnabled: false,
    allowDisable: true,
    variantSupport: ["small", "standard", "detailed"],
    legacyFlag: "includeCeoMessage",
    dataDependencies: ["ceo"],
  },
  team: {
    key: "team",
    title: "Team",
    description:
      "Named people, roles, and skills that establish delivery credibility.",
    group: "credibility",
    pageFile: "pages/06-team/TeamPage.tsx",
    defaultEnabled: false,
    allowDisable: true,
    variantSupport: ["small", "standard", "detailed"],
    legacyFlag: "includeTeam",
    dataDependencies: ["team"],
  },
  partners: {
    key: "partners",
    title: "Partners",
    description:
      "Technology and ecosystem credibility page for manufacturers or partner logos.",
    group: "credibility",
    pageFile: "pages/07-partners/PartnersPage.tsx",
    defaultEnabled: false,
    allowDisable: true,
    variantSupport: ["small", "standard", "detailed"],
    legacyFlag: "includePartners",
  },
  "proposal-description": {
    key: "proposal-description",
    title: "Proposal Description",
    description:
      "Commercial framing page with addressee, object, and opening proposal narrative.",
    group: "scope",
    pageFile: "pages/08-proposal-description/ProposalDescriptionPage.tsx",
    defaultEnabled: true,
    allowDisable: false,
    variantSupport: ["small", "standard", "detailed"],
    dataDependencies: ["proposal"],
  },
  "service-sections": {
    key: "service-sections",
    title: "Service Sections",
    description:
      "Main scope and costing pages, driven by the approved service layout policy.",
    group: "scope",
    pageFile: "pages/09-service-section/ServiceSections.tsx",
    defaultEnabled: true,
    allowDisable: false,
    variantSupport: ["standard", "detailed"],
    dataDependencies: ["services"],
  },
  "project-summary": {
    key: "project-summary",
    title: "Project Summary",
    description:
      "Financial summary page consolidating subtotal and total project cost.",
    group: "commercial",
    pageFile: "pages/10-project-summary/ProjectSummaryPage.tsx",
    defaultEnabled: true,
    allowDisable: false,
    variantSupport: ["small", "standard", "detailed"],
    dataDependencies: ["projectSummary"],
  },
  "optional-pages": {
    key: "optional-pages",
    title: "Optional Pages",
    description:
      "User-authored appendix-style pages that render after the project summary.",
    group: "scope",
    pageFile: "pages/11-optional/OptionalPages.tsx",
    defaultEnabled: false,
    allowDisable: true,
    variantSupport: ["small", "standard", "detailed"],
    dataDependencies: ["optionalPages"],
  },
  "exclusions-conditions": {
    key: "exclusions-conditions",
    title: "Exclusions and Conditions",
    description:
      "Commercial completion page for exclusions, payment terms, notes, and contact block.",
    group: "commercial",
    pageFile: "pages/12-exclusions-conditions/ExclusionsConditionsPage.tsx",
    defaultEnabled: true,
    allowDisable: false,
    variantSupport: ["small", "standard", "detailed"],
    dataDependencies: [
      "exclusions",
      "specialConditions",
      "notes",
      "paymentTerms",
      "contactInfo",
    ],
  },
  "terms-and-conditions": {
    key: "terms-and-conditions",
    title: "Terms and Conditions",
    description:
      "Closing legal and commercial terms page used for production-ready quotes.",
    group: "commercial",
    pageFile: "pages/13-terms-and-conditions/TermsAndConditionsPage.tsx",
    defaultEnabled: true,
    allowDisable: true,
    variantSupport: ["small", "standard", "detailed"],
    legacyFlag: "includeTermsAndConditions",
  },
} as const satisfies Record<
  QuoteDocumentSectionKey,
  QuoteDocumentSectionCatalogEntry
>;

export const quoteDocumentSectionCatalogEntries =
  QUOTE_DOCUMENT_SECTION_KEYS.map((key) => quoteDocumentSectionCatalog[key]);

export function getQuoteDocumentSectionCatalogEntry(
  key: QuoteDocumentSectionKey,
) {
  return quoteDocumentSectionCatalog[key];
}
