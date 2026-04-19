import { applyPatch as fjpApply, type Operation } from "fast-json-patch";
import {
  getDocumentPlanSectionForLegacyFlag,
  getLegacyFlagForDocumentPlanSection,
} from "./document/document-plan";
import { quoteDataSchema, type QuoteData } from "./schema";

export type { Operation };

function decodePointerSegment(segment: string) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function getPointerSegments(path: string) {
  if (!path || path === "/") {
    return [];
  }

  return path
    .split("/")
    .slice(1)
    .map((segment) => decodePointerSegment(segment));
}

function pathExists(value: unknown, path: string) {
  const segments = getPointerSegments(path);
  let current = value;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      if (!/^\d+$/.test(segment)) {
        return false;
      }

      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return false;
      }

      current = current[index];
      continue;
    }

    if (!current || typeof current !== "object") {
      return false;
    }

    const record = current as Record<string, unknown>;
    if (!(segment in record)) {
      return false;
    }

    current = record[segment];
  }

  return true;
}

function parentPathExists(value: unknown, path: string) {
  const segments = getPointerSegments(path);
  if (segments.length === 0) {
    return true;
  }

  const parentSegments = segments.slice(0, -1);
  if (parentSegments.length === 0) {
    return true;
  }

  return pathExists(value, `/${parentSegments.join("/")}`);
}

function normalizeOperationForDocument(
  value: Partial<QuoteData>,
  operation: Operation,
): Operation {
  if (operation.op !== "replace") {
    return operation;
  }

  if (pathExists(value, operation.path)) {
    return operation;
  }

  if (!parentPathExists(value, operation.path)) {
    return operation;
  }

  return {
    ...operation,
    op: "add",
  };
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function syncLegacyFlagAcrossPlans(
  next: Partial<QuoteData>,
  flag: keyof QuoteData,
  enabled: boolean,
) {
  next[flag] = enabled;

  const legacyKey =
    typeof flag === "string"
      ? getDocumentPlanSectionForLegacyFlag(flag)
      : undefined;

  for (const planKey of ["composition", "documentPlan"] as const) {
    const plan = readRecord(next[planKey]);
    if (!plan) {
      continue;
    }

    if (Array.isArray(plan.sections)) {
      for (const section of plan.sections) {
        const record = readRecord(section);
        if (record?.key === flag) {
          record.enabled = enabled;
        }
      }
    }

    if (legacyKey && Array.isArray(plan.sectionSelections)) {
      for (const selection of plan.sectionSelections) {
        const record = readRecord(selection);
        if (record?.key === legacyKey) {
          record.enabled = enabled;
        }
      }
    }
  }
}

function syncServiceLayoutAcrossPlans(
  next: Partial<QuoteData>,
  value: unknown,
) {
  for (const planKey of ["composition", "documentPlan"] as const) {
    const plan = readRecord(next[planKey]);
    if (!plan) {
      continue;
    }

    plan.serviceLayout = value;
    plan.serviceLayoutPolicy = value;
  }
}

function syncDocumentPlanCompatibility(
  next: Partial<QuoteData>,
  operation: Operation,
) {
  const path = operation.path;

  if (!path.startsWith("/")) {
    return;
  }

  const topLevelFlag = path.slice(1);
  if (
    /^include[A-Z]/.test(topLevelFlag) &&
    typeof operation.value === "boolean"
  ) {
    syncLegacyFlagAcrossPlans(
      next,
      topLevelFlag as keyof QuoteData,
      operation.value,
    );
    return;
  }

  if (
    (path === "/composition/serviceLayout" ||
      path === "/composition/serviceLayoutPolicy" ||
      path === "/documentPlan/serviceLayout" ||
      path === "/documentPlan/serviceLayoutPolicy") &&
    operation.value !== undefined
  ) {
    syncServiceLayoutAcrossPlans(next, operation.value);
    return;
  }

  const sectionMatch = path.match(
    /^\/(composition|documentPlan)\/sections\/(\d+)\/enabled$/,
  );
  if (sectionMatch) {
    const [, planKey, rawIndex] = sectionMatch;
    const plan = readRecord(next[planKey]);
    const section = Array.isArray(plan?.sections)
      ? readRecord(plan.sections[Number(rawIndex)])
      : null;
    const key = typeof section?.key === "string" ? section.key : null;
    if (key && typeof section?.enabled === "boolean") {
      syncLegacyFlagAcrossPlans(
        next,
        key as keyof QuoteData,
        section.enabled,
      );
    }
    return;
  }

  const selectionMatch = path.match(
    /^\/(composition|documentPlan)\/sectionSelections\/(\d+)\/enabled$/,
  );
  if (selectionMatch) {
    const [, planKey, rawIndex] = selectionMatch;
    const plan = readRecord(next[planKey]);
    const selection = Array.isArray(plan?.sectionSelections)
      ? readRecord(plan.sectionSelections[Number(rawIndex)])
      : null;
    const key = typeof selection?.key === "string" ? selection.key : null;
    const legacyFlag = key ? getLegacyFlagForDocumentPlanSection(key) : undefined;
    if (legacyFlag && typeof selection?.enabled === "boolean") {
      syncLegacyFlagAcrossPlans(next, legacyFlag as keyof QuoteData, selection.enabled);
    }
  }
}

export function applyPatch(data: Partial<QuoteData>, ops: Operation[]): Partial<QuoteData> {
  let next = structuredClone(data);

  for (const operation of ops) {
    const normalizedOperation = normalizeOperationForDocument(next, operation);
    const result = fjpApply(
      next as object,
      [normalizedOperation],
      true,
      false,
    );
    next = result.newDocument as Partial<QuoteData>;
    syncDocumentPlanCompatibility(next, normalizedOperation);
  }

  return next;
}

export function validatePartial(data: unknown): { issues: { path: string; message: string }[] } {
  const parsed = quoteDataSchema.partial().safeParse(data);
  if (parsed.success) return { issues: [] };
  return {
    issues: parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}
