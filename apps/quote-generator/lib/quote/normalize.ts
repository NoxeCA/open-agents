import { syncQuoteDocumentState } from "./document/builder";
import type { QuoteData } from "./schema";

type LegacyServiceLike = {
  sectionNumber?: unknown;
  sectionName?: unknown;
  description?: unknown;
  totalCost?: unknown;
  total?: unknown;
  layout?: unknown;
  bomItems?: unknown;
  laborCategories?: unknown;
  bomSubtotal?: unknown;
  laborSubtotal?: unknown;
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
  const bomItems = Array.isArray(row.bomItems)
    ? row.bomItems
    : normalizeLegacyItems(row.items);
  const laborCategories = Array.isArray(row.laborCategories)
    ? row.laborCategories
    : undefined;
  const bomSubtotal =
    row.bomSubtotal !== undefined
      ? toNumber(row.bomSubtotal, 0)
      : (bomItems ?? []).reduce((sum, item) => sum + toNumber(item.total, 0), 0);
  const laborSubtotal =
    row.laborSubtotal !== undefined
      ? toNumber(row.laborSubtotal, 0)
      : (laborCategories ?? []).reduce(
          (sum, item) =>
            sum +
            (item &&
            typeof item === "object" &&
            "amount" in item
              ? toNumber(item.amount, 0)
              : 0),
          0,
        );
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
    bomItems,
    bomSubtotal,
    laborCategories,
    laborSubtotal,
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

  const next: Partial<QuoteData> = { ...data };
  delete next.document;

  if (Array.isArray(data.services)) {
    next.services = data.services
      .map((service, index) => normalizeService(service, index))
      .filter((service): service is NonNullable<typeof service> => service !== null);
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

  return {
    ...next,
    document: syncQuoteDocumentState({
      ...next,
      document: data.document,
    }),
  };
}
