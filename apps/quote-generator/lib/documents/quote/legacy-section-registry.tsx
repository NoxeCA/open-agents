import type { ReactNode, ComponentType } from "react";
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
import {
  LEGACY_QUOTE_SECTION_TYPES,
  resolveEnabledLegacyQuoteSections,
  resolveLegacyQuoteSection,
  type LegacyQuoteResolvedSection,
  type LegacyQuoteSectionKey,
  type LegacyQuoteSectionPropsMap,
  type LegacyQuoteSectionRenderContext,
} from "./legacy-section-adapters";

type LegacyQuoteSectionComponentMap = {
  [TKey in LegacyQuoteSectionKey]: ComponentType<
    LegacyQuoteSectionPropsMap[TKey]
  >;
};

export interface LegacyQuoteRegistryRenderArgs {
  element: {
    props: {
      context: LegacyQuoteSectionRenderContext;
    };
  };
  children?: ReactNode;
}

export interface LegacyQuoteRegistryElementDefinition {
  id: string;
  type: LegacyQuoteResolvedSection["type"];
  props: {
    context: LegacyQuoteSectionRenderContext;
  };
  children: [];
}

export const legacyQuoteSectionComponents = {
  cover: CoverPage,
  "table-of-contents": TableOfContentsPage,
  "about-us": AboutUsPage,
  culture: CulturePage,
  "ceo-message": CeoMessagePage,
  team: TeamPage,
  partners: PartnersPage,
  "proposal-description": ProposalDescriptionPage,
  "service-sections": ServiceSections,
  "project-summary": ProjectSummaryPage,
  "optional-pages": OptionalPages,
  "exclusions-conditions": ExclusionsConditionsPage,
  "terms-and-conditions": TermsAndConditionsPage,
} satisfies LegacyQuoteSectionComponentMap;

function renderResolvedLegacyQuoteSection<
  TKey extends LegacyQuoteSectionKey,
>(
  section: LegacyQuoteResolvedSection<TKey>,
) {
  const Component = legacyQuoteSectionComponents[
    section.key
  ] as ComponentType<LegacyQuoteSectionPropsMap[TKey]>;

  return <Component {...section.props} />;
}

function createLegacyQuoteRegistryEntry<TKey extends LegacyQuoteSectionKey>(
  key: TKey,
) {
  return ({ element }: LegacyQuoteRegistryRenderArgs) => {
    const section = resolveLegacyQuoteSection(
      key,
      element.props.context,
    );

    return renderResolvedLegacyQuoteSection(section);
  };
}

export function createLegacyQuotePdfSectionRegistry() {
  return {
    registry: {
      [LEGACY_QUOTE_SECTION_TYPES.cover]:
        createLegacyQuoteRegistryEntry("cover"),
      [LEGACY_QUOTE_SECTION_TYPES["table-of-contents"]]:
        createLegacyQuoteRegistryEntry("table-of-contents"),
      [LEGACY_QUOTE_SECTION_TYPES["about-us"]]:
        createLegacyQuoteRegistryEntry("about-us"),
      [LEGACY_QUOTE_SECTION_TYPES.culture]:
        createLegacyQuoteRegistryEntry("culture"),
      [LEGACY_QUOTE_SECTION_TYPES["ceo-message"]]:
        createLegacyQuoteRegistryEntry("ceo-message"),
      [LEGACY_QUOTE_SECTION_TYPES.team]:
        createLegacyQuoteRegistryEntry("team"),
      [LEGACY_QUOTE_SECTION_TYPES.partners]:
        createLegacyQuoteRegistryEntry("partners"),
      [LEGACY_QUOTE_SECTION_TYPES["proposal-description"]]:
        createLegacyQuoteRegistryEntry("proposal-description"),
      [LEGACY_QUOTE_SECTION_TYPES["service-sections"]]:
        createLegacyQuoteRegistryEntry("service-sections"),
      [LEGACY_QUOTE_SECTION_TYPES["project-summary"]]:
        createLegacyQuoteRegistryEntry("project-summary"),
      [LEGACY_QUOTE_SECTION_TYPES["optional-pages"]]:
        createLegacyQuoteRegistryEntry("optional-pages"),
      [LEGACY_QUOTE_SECTION_TYPES["exclusions-conditions"]]:
        createLegacyQuoteRegistryEntry("exclusions-conditions"),
      [LEGACY_QUOTE_SECTION_TYPES["terms-and-conditions"]]:
        createLegacyQuoteRegistryEntry("terms-and-conditions"),
    },
  };
}

export function renderLegacyQuoteSection<TKey extends LegacyQuoteSectionKey>(
  key: TKey,
  context: LegacyQuoteSectionRenderContext,
) {
  return renderResolvedLegacyQuoteSection(
    resolveLegacyQuoteSection(key, context),
  );
}

export function renderEnabledLegacyQuoteSections(
  context: LegacyQuoteSectionRenderContext,
) {
  return resolveEnabledLegacyQuoteSections(context).map((section) =>
    renderResolvedLegacyQuoteSection(section),
  );
}

export function buildLegacyQuoteRegistryElements(
  context: LegacyQuoteSectionRenderContext,
): LegacyQuoteRegistryElementDefinition[] {
  return resolveEnabledLegacyQuoteSections(context).map((section) => ({
    children: [],
    id: `legacy-quote-section-${section.key}`,
    props: {
      context,
    },
    type: section.type,
  }));
}
