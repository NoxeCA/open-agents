import { normalizeQuoteData } from "./normalize";
import {
  quoteBusinessDataSchema,
  type QuoteBusinessData,
  type QuoteData,
} from "./schema";

export type QuoteProductionReadiness = {
  normalizedData: Partial<QuoteData>;
  parsedData?: QuoteBusinessData;
  renderReadiness: "ready" | "blocked";
  blockers: string[];
  blockingIssues: string[];
  qualityWarnings: string[];
};

const EXACT_PLACEHOLDERS = new Set([
  "-",
  "—",
  "n/a",
  "na",
  "none",
  "unknown",
  "inconnu",
  "tbd",
  "todo",
  "pending",
  "a confirmer",
  "à confirmer",
  "a venir",
  "à venir",
  "to confirm",
  "to be confirmed",
  "not provided",
  "non fourni",
]);

const PHRASE_PLACEHOLDERS = [
  /\ba confirmer\b/,
  /\bà confirmer\b/,
  /\bto confirm\b/,
  /\bto be confirmed\b/,
  /\btbd\b/,
  /\bpending\b/,
];

type BlockingIssue = {
  path: string;
  message: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPlaceholderText(value: string) {
  const normalized = normalizeText(value);

  if (EXACT_PLACEHOLDERS.has(normalized)) {
    return true;
  }

  return PHRASE_PLACEHOLDERS.some((pattern) => pattern.test(normalized));
}

function addBlockingIssue(
  issues: Map<string, string>,
  path: string,
  message: string,
) {
  if (!path || issues.has(path)) {
    return;
  }

  issues.set(path, message);
}

function formatPath(path: string[]) {
  return path.join(".");
}

function shouldIgnorePlaceholderPath(path: string[]) {
  if (path[0] === "jsonRender" || path[0] === "document") {
    return true;
  }

  if (path.length >= 5 && path[0] === "services") {
    const [, , collection, , field] = path;
    if (collection === "bomItems" && field === "oem") {
      return true;
    }
  }

  return false;
}

function collectPlaceholderIssues(
  value: unknown,
  path: string[] = [],
): BlockingIssue[] {
  if (typeof value === "string") {
    if (!isPlaceholderText(value)) {
      return [];
    }

    if (shouldIgnorePlaceholderPath(path)) {
      return [];
    }

    const currentPath = formatPath(path);
    return currentPath
      ? [
          {
            path: currentPath,
            message: `${currentPath} still contains placeholder text: "${value.trim()}"`,
          },
        ]
      : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectPlaceholderIssues(item, [...path, String(index)]),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) =>
      collectPlaceholderIssues(nested, [...path, key]),
    );
  }

  return [];
}

function collectBusinessRuleIssues(data: QuoteBusinessData): BlockingIssue[] {
  const issues: BlockingIssue[] = [];

  if (!data.projectSummary.description.trim()) {
    issues.push({
      path: "projectSummary.description",
      message:
        "projectSummary.description is still empty. Add a concise commercial summary before rendering.",
    });
  }

  if (data.exclusions.length === 0) {
    issues.push({
      path: "exclusions",
      message:
        "exclusions is empty. Every production quote must state strict scope exclusions for work by others and out-of-scope items.",
    });
  }

  if (data.paymentTerms.length === 0) {
    issues.push({
      path: "paymentTerms",
      message:
        "paymentTerms is empty. Every production quote must include payment terms, with a signature deposit by default unless the user confirmed another structure.",
    });
  }

  return issues;
}

function collectQualityWarnings(data: QuoteBusinessData) {
  const warnings: string[] = [];

  if (data.services.length === 0) {
    warnings.push("No service sections are populated yet.");
  }

  const emptySections = data.services
    .filter(
      (service) =>
        (service.bomItems?.length ?? 0) === 0 &&
        (service.laborCategories?.length ?? 0) === 0,
    )
    .map((service) => service.sectionName);

  if (emptySections.length > 0) {
    warnings.push(
      `Some service sections have no line items yet: ${emptySections.join(", ")}`,
    );
  }

  return warnings;
}

export function assessQuoteProductionReadiness(
  data: Partial<QuoteData>,
): QuoteProductionReadiness {
  const normalizedData = normalizeQuoteData(data);
  const blockingIssues = new Map<string, string>();
  const parsed = quoteBusinessDataSchema.safeParse(normalizedData);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.path.length === 0) {
        continue;
      }

      const path = formatPath(issue.path.map(String));
      addBlockingIssue(
        blockingIssues,
        path,
        `${path}: ${issue.message}`,
      );
    }

    return {
      normalizedData,
      renderReadiness: "blocked",
      blockers: [...blockingIssues.keys()],
      blockingIssues: [...blockingIssues.values()],
      qualityWarnings: [],
    };
  }

  for (const issue of collectPlaceholderIssues(parsed.data)) {
    addBlockingIssue(blockingIssues, issue.path, issue.message);
  }

  for (const issue of collectBusinessRuleIssues(parsed.data)) {
    addBlockingIssue(blockingIssues, issue.path, issue.message);
  }

  return {
    normalizedData,
    parsedData: parsed.data,
    renderReadiness: blockingIssues.size === 0 ? "ready" : "blocked",
    blockers: [...blockingIssues.keys()],
    blockingIssues: [...blockingIssues.values()],
    qualityWarnings: collectQualityWarnings(parsed.data),
  };
}
