import { checkIntegrity } from "@/lib/json-render/spec/integrity";
import { isSeededQuoteJsonRenderPlaceholderSpec } from "@/lib/json-render/placeholder-spec";
import {
  specDocumentSchema,
  specEnvelopeSchema,
} from "@/lib/json-render/spec/schema";

import type {
  DocumentSummary,
  JsonRenderDraft,
  JsonRenderIntegrityIssue,
} from "../tool-types";

export const JSON_RENDER_DRAFT_KEY = "jsonRenderDraft";
export const JSON_RENDER_DRAFT_STORAGE_PATH = "/jsonRenderDraft" as const;

function readCanonicalDraft(data: Record<string, unknown>) {
  const jsonRender = isRecord(data.jsonRender) ? data.jsonRender : null;
  if (jsonRender && jsonRender.spec) {
    return jsonRender.spec;
  }

  return data[JSON_RENDER_DRAFT_KEY];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatZodPath(path: Array<string | number>) {
  return path.length > 0 ? path.join(".") : "<root>";
}

function normalizeZodPath(path: PropertyKey[]): Array<string | number> {
  return path.map((segment) =>
    typeof segment === "symbol" ? segment.toString() : segment,
  );
}

function walkDraftNode(
  value: unknown,
  stats: {
    imageCount: number;
    sectionIds: Set<string>;
  },
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      walkDraftNode(item, stats);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (value.type === "Image") {
    stats.imageCount += 1;
  }

  if (value.type === "Page" && typeof value.sectionId === "string") {
    stats.sectionIds.add(value.sectionId);
  }

  if (value.type === "ServiceSection") {
    if (typeof value.sectionId === "string") {
      stats.sectionIds.add(value.sectionId);
    } else if (typeof value.sectionNumber === "number") {
      stats.sectionIds.add(`service-${value.sectionNumber}`);
    }
  }

  for (const child of Object.values(value)) {
    walkDraftNode(child, stats);
  }
}

function mapIntegrityIssue(
  issue: ReturnType<typeof checkIntegrity>[number],
): JsonRenderIntegrityIssue {
  if (issue.kind === "image-unknown-asset") {
    return {
      kind: issue.kind,
      path: issue.path,
      src: issue.src,
    };
  }

  return {
    kind: issue.kind,
    path: issue.path,
    sectionId: issue.sectionId,
  };
}

export function readJsonRenderDraft(data: unknown): JsonRenderDraft | null {
  if (!isRecord(data)) {
    return null;
  }

  const draft = readCanonicalDraft(data);
  if (isSeededQuoteJsonRenderPlaceholderSpec(draft)) {
    return null;
  }
  const parsed = specEnvelopeSchema.safeParse(draft);
  return parsed.success ? (parsed.data as JsonRenderDraft) : null;
}

export function summarizeJsonRenderDraft(
  draft: unknown,
): DocumentSummary | null {
  const parsed = specEnvelopeSchema.safeParse(draft);
  if (!parsed.success) {
    return null;
  }

  const document = parsed.data.document;
  const children = Array.isArray(document.children) ? document.children : [];
  const topLevelNodeTypes = children
    .map((child) =>
      isRecord(child) && typeof child.type === "string" ? child.type : "Unknown",
    )
    .filter((type, index, values) => values.indexOf(type) === index);

  const stats = {
    imageCount: 0,
    sectionIds: new Set<string>(),
  };
  walkDraftNode(children, stats);

  return {
    storagePath: JSON_RENDER_DRAFT_STORAGE_PATH,
    lang: document.lang === "en" ? "en" : "fr",
    topLevelNodeCount: children.length,
    topLevelNodeTypes,
    pageCount: children.filter(
      (child) => isRecord(child) && child.type === "Page",
    ).length,
    serviceSectionCount: children.filter(
      (child) => isRecord(child) && child.type === "ServiceSection",
    ).length,
    imageCount: stats.imageCount,
    attachmentCount: Array.isArray(parsed.data.attachments)
      ? parsed.data.attachments.length
      : 0,
    sectionIds: Array.from(stats.sectionIds),
  };
}

export function validateJsonRenderDraft(
  draft: unknown,
):
  | {
      ok: true;
      draft: JsonRenderDraft;
      integrityIssues: JsonRenderIntegrityIssue[];
    }
  | {
      ok: false;
      error: string;
    } {
  const parsed = specEnvelopeSchema.safeParse(draft);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map(
          (issue) =>
            `${formatZodPath(normalizeZodPath(issue.path))}: ${issue.message}`,
        )
        .join("; "),
    };
  }

  const strict = specDocumentSchema.safeParse(parsed.data);
  const integrityIssues = strict.success
    ? checkIntegrity(strict.data).map(mapIntegrityIssue)
    : [];

  return {
    ok: true,
    draft: parsed.data as JsonRenderDraft,
    integrityIssues,
  };
}
