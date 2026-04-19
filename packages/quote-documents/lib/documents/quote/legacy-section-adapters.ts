import type { ComponentProps } from "react";
import type {
  Language,
  QuoteTranslations,
} from "@/lib/locales/loader";
import CoverPage from "./pages/01-cover";
import TableOfContentsPage from "./pages/02-table-of-contents/TableOfContentsPage";
import AboutUsPage from "./pages/03-about-us/AboutUsPage";
import CulturePage from "./pages/04-culture/CulturePage";
import CeoMessagePage from "./pages/05-ceo-message/CeoMessagePage";
import TeamPage from "./pages/06-team/TeamPage";
import PartnersPage from "./pages/07-partners/PartnersPage";
import ProposalDescriptionPage from "./pages/08-proposal-description/ProposalDescriptionPage";
import ServiceSections from "./pages/09-service-section/ServiceSections";
import ProjectSummaryPage from "./pages/10-project-summary/ProjectSummaryPage";
import OptionalPages from "./pages/11-optional/OptionalPages";
import ExclusionsConditionsPage from "./pages/12-exclusions-conditions/ExclusionsConditionsPage";
import TermsAndConditionsPage from "./pages/13-terms-and-conditions/TermsAndConditionsPage";
import type { QuoteData } from "./schema";
import type { PageNumberCollector } from "./shared/pagination";

export interface LegacyQuoteRenderAssets {
  logoBase64: string;
  hexPatternBase64: string;
  hexPatternBottomRightBase64: string;
  arrowsBase64: string;
  noxeXLogoBase64: string;
  darkArrowBase64: string;
  grayArrowBase64: string;
  lightGrayArrowBase64: string;
  infoIconBase64: string;
}

export interface LegacyQuoteSectionRenderContext {
  data: QuoteData;
  lang: QuoteTranslations;
  selectedLang: Language;
  pageHeader: string;
  assets: LegacyQuoteRenderAssets;
  pageNumbers: PageNumberCollector;
}

export interface CreateLegacyQuoteSectionRenderContextOptions {
  data: QuoteData;
  lang: QuoteTranslations;
  selectedLang: Language;
  assets: LegacyQuoteRenderAssets;
  pageNumbers: PageNumberCollector;
}

export const LEGACY_QUOTE_SECTION_ORDER = [
  "cover",
  "table-of-contents",
  "about-us",
  "culture",
  "ceo-message",
  "team",
  "partners",
  "proposal-description",
  "service-sections",
  "project-summary",
  "optional-pages",
  "exclusions-conditions",
  "terms-and-conditions",
] as const;

export type LegacyQuoteSectionKey =
  (typeof LEGACY_QUOTE_SECTION_ORDER)[number];

export const LEGACY_QUOTE_SECTION_TYPES = {
  cover: "LegacyQuoteCoverPage",
  "table-of-contents": "LegacyQuoteTableOfContentsPage",
  "about-us": "LegacyQuoteAboutUsPage",
  culture: "LegacyQuoteCulturePage",
  "ceo-message": "LegacyQuoteCeoMessagePage",
  team: "LegacyQuoteTeamPage",
  partners: "LegacyQuotePartnersPage",
  "proposal-description": "LegacyQuoteProposalDescriptionPage",
  "service-sections": "LegacyQuoteServiceSections",
  "project-summary": "LegacyQuoteProjectSummaryPage",
  "optional-pages": "LegacyQuoteOptionalPages",
  "exclusions-conditions": "LegacyQuoteExclusionsConditionsPage",
  "terms-and-conditions": "LegacyQuoteTermsAndConditionsPage",
} as const satisfies Record<LegacyQuoteSectionKey, string>;

export type LegacyQuoteSectionRegistryType =
  (typeof LEGACY_QUOTE_SECTION_TYPES)[LegacyQuoteSectionKey];

export type LegacyQuoteSectionPropsMap = {
  cover: ComponentProps<typeof CoverPage>;
  "table-of-contents": ComponentProps<typeof TableOfContentsPage>;
  "about-us": ComponentProps<typeof AboutUsPage>;
  culture: ComponentProps<typeof CulturePage>;
  "ceo-message": ComponentProps<typeof CeoMessagePage>;
  team: ComponentProps<typeof TeamPage>;
  partners: ComponentProps<typeof PartnersPage>;
  "proposal-description": ComponentProps<typeof ProposalDescriptionPage>;
  "service-sections": ComponentProps<typeof ServiceSections>;
  "project-summary": ComponentProps<typeof ProjectSummaryPage>;
  "optional-pages": ComponentProps<typeof OptionalPages>;
  "exclusions-conditions": ComponentProps<typeof ExclusionsConditionsPage>;
  "terms-and-conditions": ComponentProps<typeof TermsAndConditionsPage>;
};

export interface LegacyQuoteSectionAdapter<
  TKey extends LegacyQuoteSectionKey = LegacyQuoteSectionKey,
> {
  key: TKey;
  type: (typeof LEGACY_QUOTE_SECTION_TYPES)[TKey];
  isEnabled: (
    context: LegacyQuoteSectionRenderContext,
  ) => boolean;
  resolveProps: (
    context: LegacyQuoteSectionRenderContext,
  ) => LegacyQuoteSectionPropsMap[TKey];
}

export interface LegacyQuoteResolvedSection<
  TKey extends LegacyQuoteSectionKey = LegacyQuoteSectionKey,
> {
  key: TKey;
  type: (typeof LEGACY_QUOTE_SECTION_TYPES)[TKey];
  props: LegacyQuoteSectionPropsMap[TKey];
}

function getCommonPageShellProps(
  context: LegacyQuoteSectionRenderContext,
) {
  return {
    arrowsBase64: context.assets.arrowsBase64,
    logoBase64: context.assets.logoBase64,
    pageHeader: context.pageHeader,
    pageNumbers: context.pageNumbers,
  };
}

export function createLegacyQuoteSectionRenderContext(
  options: CreateLegacyQuoteSectionRenderContextOptions,
): LegacyQuoteSectionRenderContext {
  return {
    assets: options.assets,
    data: options.data,
    lang: options.lang,
    pageHeader: options.data.documentType || "",
    pageNumbers: options.pageNumbers,
    selectedLang: options.selectedLang,
  };
}

export const legacyQuoteSectionAdapters = {
  cover: {
    key: "cover",
    type: LEGACY_QUOTE_SECTION_TYPES.cover,
    isEnabled: () => true,
    resolveProps: (context) => ({
      data: context.data,
      hexPatternBase64: context.assets.hexPatternBase64,
      lang: context.lang,
      logoBase64: context.assets.logoBase64,
      selectedLang: context.selectedLang,
    }),
  },
  "table-of-contents": {
    key: "table-of-contents",
    type: LEGACY_QUOTE_SECTION_TYPES["table-of-contents"],
    isEnabled: () => true,
    resolveProps: (context) => ({
      data: context.data,
      lang: context.lang,
      ...getCommonPageShellProps(context),
    }),
  },
  "about-us": {
    key: "about-us",
    type: LEGACY_QUOTE_SECTION_TYPES["about-us"],
    isEnabled: (context) => context.data.includeAboutUs !== false,
    resolveProps: (context) => ({
      data: context.data,
      lang: context.lang,
      noxeXLogoBase64: context.assets.noxeXLogoBase64,
      ...getCommonPageShellProps(context),
    }),
  },
  culture: {
    key: "culture",
    type: LEGACY_QUOTE_SECTION_TYPES.culture,
    isEnabled: (context) => context.data.includeCulture !== false,
    resolveProps: (context) => ({
      data: context.data,
      lang: context.lang,
      ...getCommonPageShellProps(context),
    }),
  },
  "ceo-message": {
    key: "ceo-message",
    type: LEGACY_QUOTE_SECTION_TYPES["ceo-message"],
    isEnabled: (context) =>
      context.data.includeCeoMessage !== false &&
      Boolean(context.data.ceo),
    resolveProps: (context) => ({
      arrowImages: {
        dark: context.assets.darkArrowBase64,
        gray: context.assets.grayArrowBase64,
        lightGray: context.assets.lightGrayArrowBase64,
      },
      data: context.data,
      hexPatternBase64: context.assets.hexPatternBase64,
      lang: context.lang,
      ...getCommonPageShellProps(context),
    }),
  },
  team: {
    key: "team",
    type: LEGACY_QUOTE_SECTION_TYPES.team,
    isEnabled: (context) =>
      context.data.includeTeam !== false &&
      Boolean(context.data.team),
    resolveProps: (context) => ({
      data: context.data,
      lang: context.lang,
      ...getCommonPageShellProps(context),
    }),
  },
  partners: {
    key: "partners",
    type: LEGACY_QUOTE_SECTION_TYPES.partners,
    isEnabled: (context) => context.data.includePartners !== false,
    resolveProps: (context) => ({
      data: context.data,
      lang: context.lang,
      ...getCommonPageShellProps(context),
    }),
  },
  "proposal-description": {
    key: "proposal-description",
    type: LEGACY_QUOTE_SECTION_TYPES["proposal-description"],
    isEnabled: () => true,
    resolveProps: (context) => ({
      data: context.data,
      lang: context.lang,
      selectedLang: context.selectedLang,
      ...getCommonPageShellProps(context),
    }),
  },
  "service-sections": {
    key: "service-sections",
    type: LEGACY_QUOTE_SECTION_TYPES["service-sections"],
    isEnabled: (context) =>
      Array.isArray(context.data.services) &&
      context.data.services.length > 0,
    resolveProps: (context) => ({
      data: context.data,
      infoIconBase64: context.assets.infoIconBase64,
      lang: context.lang,
      selectedLang: context.selectedLang,
      ...getCommonPageShellProps(context),
    }),
  },
  "project-summary": {
    key: "project-summary",
    type: LEGACY_QUOTE_SECTION_TYPES["project-summary"],
    isEnabled: () => true,
    resolveProps: (context) => ({
      data: context.data,
      infoIconBase64: context.assets.infoIconBase64,
      lang: context.lang,
      selectedLang: context.selectedLang,
      ...getCommonPageShellProps(context),
    }),
  },
  "optional-pages": {
    key: "optional-pages",
    type: LEGACY_QUOTE_SECTION_TYPES["optional-pages"],
    isEnabled: (context) =>
      Array.isArray(context.data.optionalPages) &&
      context.data.optionalPages.length > 0,
    resolveProps: (context) => ({
      hexPatternBase64: context.assets.hexPatternBottomRightBase64,
      lang: context.lang,
      pages: context.data.optionalPages ?? [],
      root: context.data,
      ...getCommonPageShellProps(context),
    }),
  },
  "exclusions-conditions": {
    key: "exclusions-conditions",
    type: LEGACY_QUOTE_SECTION_TYPES["exclusions-conditions"],
    isEnabled: () => true,
    resolveProps: (context) => ({
      data: context.data,
      infoIconBase64: context.assets.infoIconBase64,
      lang: context.lang,
      ...getCommonPageShellProps(context),
    }),
  },
  "terms-and-conditions": {
    key: "terms-and-conditions",
    type: LEGACY_QUOTE_SECTION_TYPES["terms-and-conditions"],
    isEnabled: (context) =>
      context.data.includeTermsAndConditions !== false,
    resolveProps: (context) => ({
      data: context.data,
      lang: context.lang,
      ...getCommonPageShellProps(context),
    }),
  },
} as const satisfies {
  [TKey in LegacyQuoteSectionKey]: LegacyQuoteSectionAdapter<TKey>;
};

export function getEnabledLegacyQuoteSectionKeys(
  context: LegacyQuoteSectionRenderContext,
): LegacyQuoteSectionKey[] {
  return LEGACY_QUOTE_SECTION_ORDER.filter((key) =>
    legacyQuoteSectionAdapters[key].isEnabled(context),
  );
}

export function resolveLegacyQuoteSection<
  TKey extends LegacyQuoteSectionKey,
>(
  key: TKey,
  context: LegacyQuoteSectionRenderContext,
): LegacyQuoteResolvedSection<TKey> {
  const adapter = legacyQuoteSectionAdapters[key];

  return {
    key,
    props: adapter.resolveProps(context),
    type: adapter.type,
  } as LegacyQuoteResolvedSection<TKey>;
}

export function resolveEnabledLegacyQuoteSections(
  context: LegacyQuoteSectionRenderContext,
): LegacyQuoteResolvedSection[] {
  return getEnabledLegacyQuoteSectionKeys(context).map((key) =>
    resolveLegacyQuoteSection(key, context),
  );
}
