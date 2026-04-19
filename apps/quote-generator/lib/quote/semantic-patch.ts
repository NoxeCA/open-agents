import { resolveDocumentContentPatchPath } from "@/lib/agent/document-content-regions";
import { resolveDocumentPlanPricingLayoutPath } from "@/lib/agent/document-layout-path";
import { resolveDocumentPlanSectionVisibilityPath } from "@/lib/agent/document-section-visibility";
import type { QuoteData } from "@/lib/quote/schema";

type SemanticPatchOp = {
  path: string;
  from?: string;
  value?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeRichContentBlockShape(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeRichContentBlockShape(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  const type = typeof value.type === "string" ? value.type : null;
  if (!type) {
    return value;
  }

  const nested = value[type];
  if (!isRecord(nested)) {
    return value;
  }

  const next = { ...value, ...nested };
  delete next[type];
  return next;
}

export function normalizeSemanticPatchValue(path: string, value: unknown) {
  if (!path.startsWith("/documentContent/regions/")) {
    return value;
  }

  if (!path.includes("/blocks")) {
    return value;
  }

  return normalizeRichContentBlockShape(value);
}

export function resolveSemanticPatchPath(data: Partial<QuoteData>, path: string) {
  const resolvedVisibility = resolveDocumentPlanSectionVisibilityPath(data, path);
  const resolvedLayout = resolveDocumentPlanPricingLayoutPath(
    resolvedVisibility,
  );
  return resolveDocumentContentPatchPath(data, resolvedLayout);
}

export function resolveSemanticPatchOps<TOp extends SemanticPatchOp>(
  data: Partial<QuoteData>,
  ops: TOp[],
) {
  return ops.map((op) => {
    const path = resolveSemanticPatchPath(data, op.path);
    const value =
      op.value !== undefined ? normalizeSemanticPatchValue(path, op.value) : undefined;
    const from = op.from ? resolveSemanticPatchPath(data, op.from) : undefined;

    return {
      ...op,
      path,
      ...(value !== undefined ? { value } : {}),
      ...(from ? { from } : {}),
    } satisfies TOp;
  });
}
