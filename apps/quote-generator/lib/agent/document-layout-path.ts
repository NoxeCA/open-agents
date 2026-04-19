export const documentPlanPricingLayoutBasePath = "/documentPlan/pricingLayout";

const livePricingLayoutPaths = new Set([
  documentPlanPricingLayoutBasePath,
  "/documentPlan/serviceLayout",
  "/documentPlan/serviceLayoutPolicy",
  "/composition/serviceLayout",
  "/composition/serviceLayoutPolicy",
]);

const legacyPricingLayoutPathPatterns = [
  /^\/jsonRender\/spec\/variables\/quote\/(?:composition|documentPlan)\/serviceLayout(?:Policy)?$/,
  /^\/jsonRenderDraft\/variables\/quote\/(?:composition|documentPlan)\/serviceLayout(?:Policy)?$/,
];

export function buildDocumentPlanPricingLayoutPath() {
  return documentPlanPricingLayoutBasePath;
}

export function resolveDocumentPlanPricingLayoutPath(path: string) {
  if (livePricingLayoutPaths.has(path)) {
    return "/documentPlan/serviceLayoutPolicy";
  }

  for (const pattern of legacyPricingLayoutPathPatterns) {
    if (pattern.test(path)) {
      return "/documentPlan/serviceLayoutPolicy";
    }
  }

  return path;
}
