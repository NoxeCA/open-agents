import type { QuoteDocumentPlan } from "./document-plan";
import { quoteDataSchema, type QuoteData } from "./schema";

type QuoteRecord = Record<string, unknown>;

const PLAN_SECTION_TO_FLAG = {
  "about-us": "includeAboutUs",
  culture: "includeCulture",
  "ceo-message": "includeCeoMessage",
  team: "includeTeam",
  partners: "includePartners",
  "terms-and-conditions": "includeTermsAndConditions",
} as const satisfies Record<string, keyof QuoteData>;

const LEGACY_SECTION_KEY_ALIASES = {
  about: "about-us",
  leadership: "ceo-message",
  terms: "terms-and-conditions",
} as const;

type OptionalSectionKey = keyof typeof PLAN_SECTION_TO_FLAG;

const RENDERER_METADATA_KEYS = [
  "documentContent",
  "documentRegions",
  "editableRegions",
  "regions",
  "contentRegions",
  "regionBlocks",
  "regionContent",
] as const;

export type QuoteDocumentCompositionState = QuoteDocumentPlan | Record<string, unknown>;
export type QuoteDocumentRenderInput = QuoteData | Record<string, unknown>;

function asRecord(value: unknown): QuoteRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as QuoteRecord)
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeSectionKey(value: unknown): OptionalSectionKey | null {
  if (typeof value !== "string") {
    return null;
  }

  if (value in PLAN_SECTION_TO_FLAG) {
    return value as OptionalSectionKey;
  }

  if (value in LEGACY_SECTION_KEY_ALIASES) {
    return LEGACY_SECTION_KEY_ALIASES[
      value as keyof typeof LEGACY_SECTION_KEY_ALIASES
    ];
  }

  return null;
}

function readPlanSeed(input: QuoteRecord) {
  const directPlan = asRecord(input.documentPlan);
  if (directPlan) {
    return directPlan;
  }

  const composition = asRecord(input.composition);
  if (composition) {
    return composition;
  }

  const document = asRecord(input.document);
  return asRecord(document?.documentPlan);
}

function preserveRendererMetadata<T>(parsed: T, raw: unknown): T {
  const parsedRecord = asRecord(parsed);
  const rawRecord = asRecord(raw);

  if (!parsedRecord || !rawRecord) {
    return parsed;
  }

  const next: QuoteRecord = { ...parsedRecord };

  for (const key of RENDERER_METADATA_KEYS) {
    if (rawRecord[key] !== undefined) {
      next[key] = rawRecord[key];
    }
  }

  const parsedProposal = asRecord(parsedRecord.proposal);
  const rawProposal = asRecord(rawRecord.proposal);
  if (parsedProposal && rawProposal) {
    next.proposal = preserveRendererMetadata(parsedProposal, rawProposal);
  }

  const parsedSummary = asRecord(parsedRecord.projectSummary);
  const rawSummary = asRecord(rawRecord.projectSummary);
  if (parsedSummary && rawSummary) {
    next.projectSummary = preserveRendererMetadata(parsedSummary, rawSummary);
  }

  if (Array.isArray(parsedRecord.services) && Array.isArray(rawRecord.services)) {
    const rawServices = rawRecord.services;
    next.services = parsedRecord.services.map((service, index) =>
      preserveRendererMetadata(service, rawServices[index]),
    );
  }

  return next as T;
}

function readSectionSelections(
  plan: QuoteRecord | null,
): Array<{ key: OptionalSectionKey; enabled: boolean }> {
  if (!plan) {
    return [];
  }

  if (Array.isArray(plan.sections)) {
    return plan.sections
      .map((selection) => {
        const record = asRecord(selection);
        if (!record) {
          return null;
        }

        const key = normalizeSectionKey(record.key);
        if (!key) {
          return null;
        }

        const enabled =
          typeof record.enabled === "boolean" ? record.enabled : true;

        return { key, enabled };
      })
      .filter(
        (
          selection,
        ): selection is { key: OptionalSectionKey; enabled: boolean } =>
          Boolean(selection),
      );
  }

  if (Array.isArray(plan.sectionSelections)) {
    return plan.sectionSelections
      .map((selection) => {
        const record = asRecord(selection);
        if (!record) {
          return null;
        }

        const key = normalizeSectionKey(record.key);
        if (!key) {
          return null;
        }

        const enabled =
          typeof record.enabled === "boolean" ? record.enabled : true;

        return { key, enabled };
      })
      .filter(
        (
          selection,
        ): selection is { key: OptionalSectionKey; enabled: boolean } =>
          Boolean(selection),
      );
  }

  if (Array.isArray(plan.enabledSections)) {
    return plan.enabledSections
      .map((value) => normalizeSectionKey(value))
      .filter((key): key is OptionalSectionKey => Boolean(key))
      .map((key) => ({ key, enabled: true }));
  }

  return [];
}

function resolveSectionFlag(
  input: QuoteRecord,
  plan: QuoteRecord | null,
  sectionKey: OptionalSectionKey,
) {
  const quoteField = PLAN_SECTION_TO_FLAG[sectionKey];
  const existing = input[quoteField];
  const matched = readSectionSelections(plan).find(
    (selection) => selection.key === sectionKey,
  );

  if (matched && typeof matched.enabled === "boolean") {
    return matched.enabled;
  }

  if (typeof existing === "boolean") {
    return existing;
  }

  return quoteField === "includeTermsAndConditions" ? true : false;
}

function resolveServiceLayout(input: QuoteRecord, plan: QuoteRecord | null) {
  const explicit =
    readString(plan?.serviceLayoutPolicy) ?? readString(plan?.serviceLayout);

  if (
    explicit !== "zero-ventilation" &&
    explicit !== "itemized-without-price" &&
    explicit !== "itemized-with-price"
  ) {
    return undefined;
  }

  return explicit;
}

export function applyQuoteDocumentComposition(
  input: unknown,
  composition: QuoteDocumentCompositionState,
): QuoteData {
  const record = asRecord(input) ?? {};
  const next: QuoteRecord = {
    ...record,
    composition,
    documentPlan: composition,
  };

  for (const sectionKey of Object.keys(PLAN_SECTION_TO_FLAG) as Array<
    OptionalSectionKey
  >) {
    next[PLAN_SECTION_TO_FLAG[sectionKey]] = resolveSectionFlag(
      record,
      composition,
      sectionKey,
    );
  }

  const layout = resolveServiceLayout(record, composition);
  if (layout && Array.isArray(record.services)) {
    next.services = record.services.map((service) => {
      const current = asRecord(service) ?? {};
      return {
        ...current,
        layout,
      };
    });
  }

  return preserveRendererMetadata(quoteDataSchema.parse(next), record);
}

export function resolveQuoteDocumentRenderInput(
  input: unknown,
) {
  const record = asRecord(input) ?? {};
  const composition = readPlanSeed(record);

  return {
    composition: composition ?? undefined,
    data: composition
      ? applyQuoteDocumentComposition(record, composition)
      : preserveRendererMetadata(quoteDataSchema.parse(record), record),
  };
}
