import { buildQuoteDocumentContent } from "@/lib/documents/quote/document-content";
import { normalizeQuoteJsonRenderState } from "@/lib/json-render/quote-spec-state";
import {
  buildQuoteDocumentComposition,
  syncLegacySectionFlagsFromDocumentPlan,
  syncQuoteDocumentPlan,
} from "./document/document-plan";
import { syncQuoteDocumentState } from "./document/builder";
import type { QuoteData } from "./schema";

type LegacyServiceLike = {
  sectionNumber?: unknown;
  sectionName?: unknown;
  description?: unknown;
  overviewBlocks?: unknown;
  totalCost?: unknown;
  total?: unknown;
  layout?: unknown;
  bomItems?: unknown;
  laborCategories?: unknown;
  bomSubtotal?: unknown;
  tableIntroBlocks?: unknown;
  laborSubtotal?: unknown;
  tableOutroBlocks?: unknown;
  footerBlocks?: unknown;
  items?: unknown;
};

type LegacyItemLike = {
  qty?: unknown;
  quantity?: unknown;
  partNumber?: unknown;
  description?: unknown;
  manufacturer?: unknown;
  oem?: unknown;
  supplier?: unknown;
  unitPrice?: unknown;
  total?: unknown;
};

const FALLBACK_LAYOUT = "itemized-with-price";
const EMPTY_LIKE_STRINGS = new Set(["false", "true", "null", "undefined"]);

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toPositiveNumber(value: unknown, fallback = 1) {
  const number = toNumber(value, fallback);
  return number > 0 ? number : fallback;
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeTextValue(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return EMPTY_LIKE_STRINGS.has(trimmed.toLowerCase()) ? fallback : trimmed;
}

function normalizeLang(value: unknown): QuoteData["lang"] {
  if (typeof value !== "string") {
    return "fr";
  }

  return value.toLowerCase().startsWith("en") ? "en" : "fr";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function toLayout(value: unknown): QuoteData["services"][number]["layout"] {
  return value === "zero-ventilation" ||
    value === "itemized-without-price" ||
    value === "itemized-with-price"
    ? value
    : FALLBACK_LAYOUT;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function syncQuoteDocumentContent(
  data: Partial<QuoteData> & Record<string, unknown>,
) {
  const documentRecord = readRecord(data.document);

  return buildQuoteDocumentContent({
    documentContent: data.documentContent ?? documentRecord?.documentContent,
    optionalPages: Array.isArray(data.optionalPages)
      ? data.optionalPages.map(
          (page) => readRecord(page) ?? { blocks: undefined },
        )
      : undefined,
    proposal: readRecord(data.proposal)
      ? {
          blocks: readRecord(data.proposal)?.blocks,
        }
      : undefined,
    services: Array.isArray(data.services)
      ? data.services.map((service) => ({
          bomItems: service.bomItems,
          footerBlocks: service.footerBlocks,
          laborCategories: service.laborCategories,
          layout: service.layout,
          overviewBlocks: service.overviewBlocks,
          sectionName: service.sectionName,
          sectionNumber: service.sectionNumber,
          tableIntroBlocks: service.tableIntroBlocks,
          tableOutroBlocks: service.tableOutroBlocks,
        }))
      : undefined,
  });
}

function normalizeLegacyItems(items: unknown) {
  if (!Array.isArray(items)) {
    return undefined;
  }

  const bomItems = items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as LegacyItemLike;
      const quantity = toPositiveNumber(row.qty ?? row.quantity, 1);
      const partNumber = toString(row.partNumber, "—") || "—";
      const description = toString(row.description, "").trim();
      if (!description) {
        return null;
      }

      return {
        qty: quantity,
        partNumber,
        description,
        oem:
          toString(row.oem, "").trim() ||
          toString(row.manufacturer, "").trim() ||
          toString(row.supplier, "").trim() ||
          "—",
        unitPrice: toNumber(row.unitPrice, 0),
        total: toNumber(row.total, 0),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return bomItems.length > 0 ? bomItems : undefined;
}

function normalizeService(
  service: unknown,
  index: number,
): QuoteData["services"][number] | null {
  if (!service || typeof service !== "object") {
    return null;
  }

  const row = service as LegacyServiceLike;
  const sectionNumber = toPositiveNumber(row.sectionNumber, index + 1);
  const sectionName =
    toString(row.sectionName, "").trim() || `Section ${sectionNumber}`;
  const description = toString(row.description, "").trim();
  const overviewBlocks = Array.isArray(row.overviewBlocks)
    ? row.overviewBlocks
    : undefined;
  const bomItems = Array.isArray(row.bomItems)
    ? row.bomItems
    : normalizeLegacyItems(row.items);
  const laborCategories = Array.isArray(row.laborCategories)
    ? row.laborCategories
    : undefined;
  const tableIntroBlocks = Array.isArray(row.tableIntroBlocks)
    ? row.tableIntroBlocks
    : undefined;
  const bomSubtotal =
    row.bomSubtotal !== undefined
      ? toNumber(row.bomSubtotal, 0)
      : (bomItems ?? []).reduce(
          (sum, item) => sum + toNumber(item.total, 0),
          0,
        );
  const laborSubtotal =
    row.laborSubtotal !== undefined
      ? toNumber(row.laborSubtotal, 0)
      : (laborCategories ?? []).reduce(
          (sum, item) =>
            sum +
            (item && typeof item === "object" && "amount" in item
              ? toNumber(item.amount, 0)
              : 0),
          0,
        );
  const tableOutroBlocks = Array.isArray(row.tableOutroBlocks)
    ? row.tableOutroBlocks
    : undefined;
  const footerBlocks = Array.isArray(row.footerBlocks)
    ? row.footerBlocks
    : undefined;
  const totalCost =
    row.totalCost !== undefined
      ? toNumber(row.totalCost, 0)
      : row.total !== undefined
        ? toNumber(row.total, 0)
        : bomSubtotal + laborSubtotal;

  return {
    sectionNumber,
    sectionName,
    description,
    overviewBlocks,
    bomItems,
    bomSubtotal,
    tableIntroBlocks,
    laborCategories,
    laborSubtotal,
    tableOutroBlocks,
    footerBlocks,
    totalCost,
    layout: toLayout(row.layout),
  };
}

export function normalizeQuoteData(
  data: Partial<QuoteData>,
): Partial<QuoteData> {
  if (!data || typeof data !== "object") {
    return data;
  }

  const next: Partial<QuoteData> & Record<string, unknown> = {
    ...(data as Record<string, unknown>),
  };
  delete next.document;

  next.lang = normalizeLang(data.lang);
  next.clientName = normalizeTextValue(data.clientName);
  next.projectTitle = normalizeTextValue(data.projectTitle);
  next.projectIntro = normalizeTextValue(data.projectIntro);
  next.subtitle = normalizeTextValue(data.subtitle);
  next.documentType = normalizeTextValue(data.documentType, "PROPOSITION");
  next.documentTitle = normalizeTextValue(data.documentTitle);
  next.quoteID = normalizeTextValue(data.quoteID);
  next.quoteDate = normalizeTextValue(data.quoteDate);
  next.validUntil = normalizeTextValue(data.validUntil);
  next.revision =
    typeof data.revision === "number" && Number.isInteger(data.revision)
      ? data.revision
      : 1;

  next.preparedFor = Array.isArray(data.preparedFor) ? data.preparedFor : [];
  next.preparedBy = Array.isArray(data.preparedBy) ? data.preparedBy : [];

  const proposalRecord = readRecord(data.proposal);
  next.proposal = {
    date: normalizeTextValue(proposalRecord?.date),
    object: normalizeTextValue(proposalRecord?.object),
    addressee: {
      name: normalizeTextValue(readRecord(proposalRecord?.addressee)?.name),
      address: normalizeTextValue(
        readRecord(proposalRecord?.addressee)?.address,
      ),
      company: normalizeTextValue(
        readRecord(proposalRecord?.addressee)?.company,
      ),
    },
    paragraphs: normalizeStringArray(proposalRecord?.paragraphs) ?? [],
    ...(Array.isArray(proposalRecord?.blocks)
      ? { blocks: proposalRecord?.blocks }
      : {}),
  };

  const projectSummaryRecord = readRecord(data.projectSummary);
  next.projectSummary = {
    description: normalizeTextValue(projectSummaryRecord?.description),
    subtotal: toNumber(projectSummaryRecord?.subtotal, 0),
    totalProjectCost: toNumber(projectSummaryRecord?.totalProjectCost, 0),
  };

  if (Array.isArray(data.services)) {
    next.services = data.services
      .map((service, index) => normalizeService(service, index))
      .filter(
        (service): service is NonNullable<typeof service> => service !== null,
      );
  }

  if (Array.isArray(data.exclusions)) {
    next.exclusions = normalizeStringArray(data.exclusions) ?? [];
  }

  if (Array.isArray(data.paymentTerms)) {
    next.paymentTerms = normalizeStringArray(data.paymentTerms) ?? [];
  }

  if (Array.isArray(data.specialConditions)) {
    next.specialConditions = normalizeStringArray(data.specialConditions) ?? [];
  }

  if (Array.isArray(data.notes)) {
    next.notes = normalizeStringArray(data.notes) ?? [];
  }

  if (!Array.isArray(data.exclusions)) {
    next.exclusions = [];
  }

  if (!Array.isArray(data.paymentTerms)) {
    next.paymentTerms = [];
  }

  if (!Array.isArray(data.specialConditions)) {
    next.specialConditions = [];
  }

  if (!Array.isArray(data.notes)) {
    next.notes = [];
  }

  next.includeAboutUs = Boolean(data.includeAboutUs);
  next.includeCulture = Boolean(data.includeCulture);
  next.includeCeoMessage = Boolean(data.includeCeoMessage);
  next.includeTeam = Boolean(data.includeTeam);
  next.includePartners = Boolean(data.includePartners);
  next.includeTermsAndConditions = data.includeTermsAndConditions !== false;

  next.documentContent = syncQuoteDocumentContent(
    next as Partial<QuoteData> & Record<string, unknown>,
  );

  const documentPlan = syncQuoteDocumentPlan(next);
  next.documentPlan = documentPlan;
  next.composition = buildQuoteDocumentComposition(documentPlan);
  syncLegacySectionFlagsFromDocumentPlan(next, documentPlan);

  const document = syncQuoteDocumentState({
    ...(next as Partial<QuoteData>),
    document: data.document,
  });

  const legacyJsonRenderDraft = readRecord(data as Record<string, unknown>);
  const jsonRenderInput =
    data.jsonRender ??
    legacyJsonRenderDraft?.jsonRenderDraft ??
    legacyJsonRenderDraft?.jsonRenderSpec ??
    legacyJsonRenderDraft?.jsonRenderDocument;

  next.jsonRender = normalizeQuoteJsonRenderState(jsonRenderInput, {
    ...(next as Record<string, unknown>),
    document,
  });

  return {
    ...next,
    document: {
      ...document,
      documentPlan,
    },
  } as Partial<QuoteData>;
}
