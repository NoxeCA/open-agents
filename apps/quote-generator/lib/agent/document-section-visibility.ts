import { buildQuoteDocumentPlan } from "@/lib/quote/document/document-plan";
import type { QuoteData } from "@/lib/quote/schema";

export const documentPlanSectionVisibilityBasePath =
  "/documentPlan/sectionVisibility";

export const liveQuoteSectionVisibilityKeys = [
  "overview",
  "services",
  "about",
  "culture",
  "leadership",
  "team",
  "partners",
  "commercial",
  "terms",
] as const;

export type LiveQuoteSectionVisibilityKey =
  (typeof liveQuoteSectionVisibilityKeys)[number];

const legacySectionVisibilityPathPatterns = [
  /^\/jsonRender\/spec\/variables\/quote\/(?:composition|documentPlan)\/sectionSelections\/(\d+)\/enabled$/,
  /^\/jsonRenderDraft\/variables\/quote\/(?:composition|documentPlan)\/sectionSelections\/(\d+)\/enabled$/,
];

function isLiveQuoteSectionVisibilityKey(
  value: string,
): value is LiveQuoteSectionVisibilityKey {
  return liveQuoteSectionVisibilityKeys.includes(
    value as LiveQuoteSectionVisibilityKey,
  );
}

export function buildDocumentPlanSectionVisibilityPath(
  sectionKey: LiveQuoteSectionVisibilityKey,
) {
  return `${documentPlanSectionVisibilityBasePath}/${sectionKey}` as const;
}

export function resolveDocumentPlanSectionVisibilityPath(
  data: Partial<QuoteData>,
  path: string,
) {
  const plan = buildQuoteDocumentPlan(data);

  const resolveSectionKey = (sectionKey: string) => {
    if (!isLiveQuoteSectionVisibilityKey(sectionKey)) {
      throw new Error(
        `Unknown document section "${sectionKey}". Use one of ${liveQuoteSectionVisibilityKeys.join(", ")}.`,
      );
    }

    const index = plan.sectionSelections.findIndex(
      (section) => section.key === sectionKey,
    );

    if (index < 0) {
      throw new Error(
        `Document section "${sectionKey}" is not available in the current quote plan.`,
      );
    }

    return `/documentPlan/sectionSelections/${index}/enabled`;
  };

  if (path.startsWith(`${documentPlanSectionVisibilityBasePath}/`)) {
    const sectionKey = path.slice(
      documentPlanSectionVisibilityBasePath.length + 1,
    );
    return resolveSectionKey(sectionKey);
  }

  for (const pattern of legacySectionVisibilityPathPatterns) {
    const match = path.match(pattern);
    if (!match) {
      continue;
    }

    const sectionIndex = Number.parseInt(match[1] ?? "", 10);
    const section = plan.sectionSelections[sectionIndex];

    if (!section) {
      throw new Error(
        `Legacy document section index "${sectionIndex}" is out of bounds for the current quote plan.`,
      );
    }

    if (!isLiveQuoteSectionVisibilityKey(section.key)) {
      throw new Error(
        `Legacy document section index "${sectionIndex}" points to unsupported section "${section.key}".`,
      );
    }

    return resolveSectionKey(section.key);
  }

  return path;
}
