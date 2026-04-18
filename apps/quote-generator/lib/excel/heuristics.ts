import {
  type CellValue,
  type NeedsConfirmation,
  normalizeName,
  type ParsedWorkbook,
  type SheetData,
  type SkeletonResult,
} from "./types";

type SheetRole =
  | "metadata"
  | "evaluation"
  | "ventilation"
  | "vendor-pricing"
  | "takeoff-access"
  | "takeoff-intrusion"
  | "bom-materiel"
  | "bom-cable"
  | "bom-quincaillerie"
  | "labor-frais"
  | "labor-sous-traitant"
  | "labor-installation";

type BomItem = {
  qty: number;
  partNumber: string;
  description: string;
  oem: string;
  unitPrice: number;
  total: number;
};

type LaborCategory = {
  category: string;
  amount: number;
};

type ServiceSection = {
  sectionNumber: number;
  sectionName: string;
  description: string;
  bomItems: BomItem[];
  bomSubtotal: number;
  laborCategories: LaborCategory[];
  laborSubtotal: number;
  totalCost: number;
  layout: string;
};

type QuoteIncludeFlags = {
  includeMateriel?: boolean;
  includeCable?: boolean;
  includeQuincaillerie?: boolean;
  includeFraisDivers?: boolean;
  includeMainDoeuvre?: boolean;
};

type VentilationExtraction = {
  services: ServiceSection[];
  projectTotal: number | null;
  includeFlags: QuoteIncludeFlags;
  bomRowsExtracted: number;
};

const LEGACY_BOM_ROLES: readonly SheetRole[] = [
  "bom-materiel",
  "bom-cable",
  "bom-quincaillerie",
];

const LABOR_CODES = new Set([
  "M",
  "C",
  "Q",
  "G",
  "S",
  "LP",
  "LA",
  "LD",
  "LT",
  "LG",
  "LV",
  "LO",
]);

function detectSheetRoles(normalized: string): SheetRole[] {
  const roles = new Set<SheetRole>();

  if (/(palantir|page titre|cover|operation)/.test(normalized)) {
    roles.add("metadata");
  }
  if (/evaluation/.test(normalized)) {
    roles.add("evaluation");
  }
  if (/ventilation/.test(normalized)) {
    roles.add("ventilation");
  }
  if (/demande de prix/.test(normalized)) {
    roles.add("vendor-pricing");
  }
  if (/takeoff acces/.test(normalized)) {
    roles.add("takeoff-access");
  }
  if (/takeoff intrusion/.test(normalized)) {
    roles.add("takeoff-intrusion");
  }
  if (/materiel|materiaux/.test(normalized)) {
    roles.add("bom-materiel");
  }
  if (/cable/.test(normalized)) {
    roles.add("bom-cable");
  }
  if (/quincaillerie/.test(normalized)) {
    roles.add("bom-quincaillerie");
  }
  if (/frais (generaux|divers)/.test(normalized)) {
    roles.add("labor-frais");
  }
  if (/sous(-| )traitant/.test(normalized)) {
    roles.add("labor-sous-traitant");
  }
  if (/installation/.test(normalized)) {
    roles.add("labor-installation");
  }

  return [...roles];
}

function toNormalizedString(value: CellValue): string {
  if (value === null || value === undefined) return "";
  return normalizeName(String(value));
}

function toTrimmedString(value: CellValue): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumber(value: CellValue): number {
  if (value === null || value === undefined || value === "") return Number.NaN;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;

  const cleaned = String(value)
    .replace(/\u00a0/g, " ")
    .replace(/[^0-9.\-,]/g, "")
    .replace(/,/g, ".");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : Number.NaN;
}

function rowHasValues(row: CellValue[] | undefined) {
  return Array.isArray(row) && row.some((value) => value !== null && value !== "");
}

function humanizeSheetName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function findBomHeaderRow(sheet: SheetData) {
  const limit = Math.min(25, sheet.rows.length);
  const keywordMap: Record<string, string[]> = {
    qty: ["qte", "quantite", "qty"],
    partNumber: ["part", "produit", "piece"],
    description: ["equipment", "description"],
    unitPrice: ["unit cost", "prix unitaire", "vendant unit", "cout unitaire"],
    total: ["total cost", "sous total"],
  };

  let best:
    | { rowIndex: number; hits: number; columns: Record<string, number> }
    | null = null;

  for (let rowIndex = 0; rowIndex < limit; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    const columns: Record<string, number> = {};
    let hits = 0;

    for (let col = 0; col < row.length; col++) {
      const cell = toNormalizedString(row[col] ?? null);
      if (!cell) continue;

      for (const [field, keywords] of Object.entries(keywordMap)) {
        if (columns[field] !== undefined) continue;
        if (keywords.some((keyword) => cell.includes(keyword))) {
          columns[field] = col;
          hits++;
        }
      }
    }

    if (hits >= 4 && (!best || hits > best.hits)) {
      best = { rowIndex, hits, columns };
    }
  }

  return best;
}

function extractBomItems(sheet: SheetData): BomItem[] {
  const header = findBomHeaderRow(sheet);
  if (!header) return [];

  const items: BomItem[] = [];

  for (let rowIndex = header.rowIndex + 1; rowIndex < sheet.rows.length; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    if (!rowHasValues(row)) continue;

    const qty = toNumber(row[header.columns.qty] ?? null);
    const partNumber = toTrimmedString(row[header.columns.partNumber] ?? null);
    const description = toTrimmedString(row[header.columns.description] ?? null);

    if (!Number.isFinite(qty) || qty <= 0) continue;
    if (!partNumber || !description) continue;

    const unitPrice = Number.isFinite(
      toNumber(row[header.columns.unitPrice] ?? null),
    )
      ? toNumber(row[header.columns.unitPrice] ?? null)
      : 0;
    const totalRaw = toNumber(row[header.columns.total] ?? null);

    items.push({
      qty,
      partNumber,
      description,
      oem: "—",
      unitPrice,
      total: Number.isFinite(totalRaw) ? totalRaw : qty * unitPrice,
    });
  }

  return items;
}

function findTotalDollarColumn(sheet: SheetData) {
  const limit = Math.min(25, sheet.rows.length);

  for (let rowIndex = 0; rowIndex < limit; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    for (let col = 0; col < row.length; col++) {
      const cell = toTrimmedString(row[col] ?? null).toLowerCase();
      if (cell && /total.*\$/.test(cell)) {
        return { rowIndex, col };
      }
    }
  }

  return null;
}

function extractLaborCategories(sheet: SheetData): LaborCategory[] {
  const totalCol = findTotalDollarColumn(sheet)?.col;
  const categories: LaborCategory[] = [];

  for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    if (!rowHasValues(row)) continue;

    const code = toTrimmedString(row[0] ?? null);
    if (!LABOR_CODES.has(code)) continue;

    const description = toTrimmedString(row[1] ?? null) || code;
    const amount = totalCol !== undefined ? toNumber(row[totalCol] ?? null) : 0;

    categories.push({
      category: description,
      amount: Number.isFinite(amount) ? amount : 0,
    });
  }

  return categories;
}

function looksLikeMetadataLabel(value: string) {
  const normalized = normalizeName(value);
  if (!normalized) return false;
  return (
    value.trim().endsWith(":") ||
    /^(nom|client|charge|contact|adresse|ville|province|code postal|email|telephone|project|worksite|date|rep|bureau|mobilisation|description|code|heures unite|cost|total|note)/.test(
      normalized,
    )
  );
}

function findNextValueRight(row: CellValue[], startCol: number) {
  for (let col = startCol + 1; col < row.length; col++) {
    const candidate = toTrimmedString(row[col] ?? null);
    if (!candidate) continue;
    if (looksLikeMetadataLabel(candidate)) continue;
    return candidate;
  }
  return null;
}

function findNextValueBelow(sheet: SheetData, startRow: number, col: number) {
  const limit = Math.min(sheet.rows.length, startRow + 6);
  for (let rowIndex = startRow + 1; rowIndex < limit; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    const candidate = toTrimmedString(row[col] ?? null);
    if (!candidate) continue;
    if (looksLikeMetadataLabel(candidate)) continue;
    return candidate;
  }
  return null;
}

function findMetadataValue(sheets: SheetData[], needle: string): string | null {
  const normalizedNeedle = normalizeName(needle);

  for (const sheet of sheets) {
    for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex++) {
      const row = sheet.rows[rowIndex] ?? [];
      for (let col = 0; col < row.length; col++) {
        const cell = toTrimmedString(row[col] ?? null);
        if (!cell) continue;
        const normalizedCell = normalizeName(cell);
        if (
          normalizedCell !== normalizedNeedle &&
          !normalizedCell.includes(normalizedNeedle)
        ) {
          continue;
        }

        const right = findNextValueRight(row, col);
        if (right) return right;

        const below = findNextValueBelow(sheet, rowIndex, col);
        if (below) return below;
      }
    }
  }

  return null;
}

function extractSummaryFlagsFromSheet(sheet: SheetData): QuoteIncludeFlags {
  const flags: QuoteIncludeFlags = {};
  const labels: Array<{ key: keyof QuoteIncludeFlags; regex: RegExp }> = [
    { key: "includeMateriel", regex: /materiel|materiaux/ },
    { key: "includeCable", regex: /cable/ },
    { key: "includeQuincaillerie", regex: /quincaillerie/ },
    { key: "includeFraisDivers", regex: /frais divers/ },
    { key: "includeMainDoeuvre", regex: /main d.*oeuvre|main d.*?uvre/ },
  ];

  for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    for (let col = 0; col < row.length; col++) {
      const label = toNormalizedString(row[col] ?? null);
      if (!label) continue;

      for (const entry of labels) {
        if (!entry.regex.test(label) || flags[entry.key] !== undefined) {
          continue;
        }

        for (let offset = 1; offset <= 2; offset++) {
          const next = row[col + offset];
          if (typeof next === "boolean") {
            flags[entry.key] = next;
            break;
          }
        }
      }
    }
  }

  return flags;
}

function extractVentilationData(sheet: SheetData): VentilationExtraction {
  const header = findBomHeaderRow(sheet);
  if (!header) {
    return {
      services: [],
      projectTotal: null,
      includeFlags: extractSummaryFlagsFromSheet(sheet),
      bomRowsExtracted: 0,
    };
  }

  const services: ServiceSection[] = [];
  const includeFlags = extractSummaryFlagsFromSheet(sheet);
  const materialItems: BomItem[] = [];
  let materialHeaderName = "Matériel";
  let materialHeaderDescription = "";
  let materialSubtotal: number | null = null;
  let projectTotal: number | null = null;

  for (let rowIndex = header.rowIndex + 1; rowIndex < sheet.rows.length; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    if (!rowHasValues(row)) continue;

    const qty = toNumber(row[header.columns.qty] ?? null);
    const partNumber = toTrimmedString(row[header.columns.partNumber] ?? null);
    const description = toTrimmedString(row[header.columns.description] ?? null);
    const descriptionNormalized = normalizeName(description);
    const title = toTrimmedString(row[2] ?? null);
    const titleNormalized = normalizeName(title);
    const total = toNumber(row[header.columns.total] ?? null);

    const isMaterialHeader =
      !Number.isFinite(qty) &&
      title &&
      description &&
      !Number.isFinite(total);
    if (isMaterialHeader) {
      materialHeaderName = title;
      materialHeaderDescription = description;
      continue;
    }

    if (descriptionNormalized.includes("sous total")) {
      materialSubtotal = Number.isFinite(total)
        ? total
        : materialItems.reduce((sum, item) => sum + item.total, 0);
      continue;
    }

    if (
      !Number.isFinite(qty) &&
      title &&
      description &&
      Number.isFinite(total) &&
      titleNormalized !== "total"
    ) {
      services.push({
        sectionNumber: services.length + 2,
        sectionName: title,
        description,
        bomItems: [],
        bomSubtotal: 0,
        laborCategories: [],
        laborSubtotal: 0,
        totalCost: total,
        layout: "itemized-with-price",
      });
      continue;
    }

    if (titleNormalized === "total" && Number.isFinite(total)) {
      projectTotal = total;
      continue;
    }

    if (
      Number.isFinite(qty) &&
      qty > 0 &&
      partNumber &&
      description &&
      !descriptionNormalized.includes("sous total")
    ) {
      const unitPrice = toNumber(row[header.columns.unitPrice] ?? null);
      materialItems.push({
        qty,
        partNumber,
        description,
        oem: "—",
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
        total: Number.isFinite(total) ? total : 0,
      });
    }
  }

  if (materialItems.length > 0 || materialSubtotal !== null) {
    const resolvedSubtotal =
      materialSubtotal ??
      materialItems.reduce((sum, item) => sum + item.total, 0);

    services.unshift({
      sectionNumber: 1,
      sectionName: materialHeaderName,
      description: materialHeaderDescription,
      bomItems: materialItems,
      bomSubtotal: resolvedSubtotal,
      laborCategories: [],
      laborSubtotal: 0,
      totalCost: resolvedSubtotal,
      layout: "itemized-with-price",
    });
  }

  const normalizedServices = services.map((service, index) => ({
    ...service,
    sectionNumber: index + 1,
  }));

  return {
    services: normalizedServices,
    projectTotal,
    includeFlags,
    bomRowsExtracted: materialItems.length,
  };
}

function extractEvaluationTotal(sheet: SheetData): number | null {
  const limit = Math.min(sheet.rows.length, 40);

  for (let rowIndex = 0; rowIndex < limit; rowIndex++) {
    const row = sheet.rows[rowIndex] ?? [];
    if (!rowHasValues(row)) continue;

    const hasTotalLabel = row.some((value, colIndex) => {
      if (colIndex > 3) return false;
      return normalizeName(toTrimmedString(value ?? null)) === "total";
    });
    if (!hasTotalLabel) continue;

    const numericValues = row
      .map((value) => toNumber(value ?? null))
      .filter((value) => Number.isFinite(value));

    if (numericValues.length > 0) {
      return Math.max(...numericValues);
    }
  }

  return null;
}

function emptyQuoteDataDefaults(): Record<string, unknown> {
  return {
    projectTitle: "",
    projectIntro: "",
    clientName: "",
    preparedBy: [],
    documentType: "PROPOSITION",
    includeAboutUs: false,
    includeCulture: false,
    includeCeoMessage: false,
    includeTeam: false,
    includePartners: false,
    proposal: {
      addressee: { name: "", company: "", address: "" },
      date: "",
      object: "",
      paragraphs: [],
    },
    services: [],
    projectSummary: {
      description: "",
      subtotal: 0,
      totalProjectCost: 0,
    },
    includeMateriel: true,
    includeCable: true,
    includeQuincaillerie: true,
    includeFraisDivers: true,
    includeMainDoeuvre: true,
  };
}

function buildLegacyServices(
  roleMap: Map<SheetRole, SheetData[]>,
  needsConfirmation: NeedsConfirmation[],
) {
  const services: ServiceSection[] = [];
  let bomRowsExtracted = 0;

  for (const role of LEGACY_BOM_ROLES) {
    const sheet = roleMap.get(role)?.[0];
    if (!sheet) continue;

    const bomItems = extractBomItems(sheet);
    bomRowsExtracted += bomItems.length;
    const bomSubtotal = bomItems.reduce((sum, item) => sum + item.total, 0);

    services.push({
      sectionNumber: services.length + 1,
      sectionName: humanizeSheetName(sheet.name),
      description: "",
      bomItems,
      bomSubtotal,
      laborCategories: [],
      laborSubtotal: 0,
      totalCost: bomSubtotal,
      layout: "itemized-with-price",
    });
  }

  for (const service of services) {
    needsConfirmation.push({
      path: `services.${service.sectionNumber - 1}.layout`,
      reason: "Default layout chosen from workbook structure; confirm with user",
      confidence: "medium",
      suggestion: "itemized-with-price",
    });
  }

  return { services, bomRowsExtracted };
}

export function proposeSkeleton(wb: ParsedWorkbook): SkeletonResult {
  const needsConfirmation: NeedsConfirmation[] = [];
  const sheetsDetected: Record<string, string> = {};
  const roleMap = new Map<SheetRole, SheetData[]>();

  for (const sheet of wb.sheets) {
    const roles = detectSheetRoles(normalizeName(sheet.name));
    if (roles.length === 0) continue;

    sheetsDetected[sheet.name] = roles.join(", ");

    for (const role of roles) {
      const current = roleMap.get(role) ?? [];
      current.push(sheet);
      roleMap.set(role, current);
    }
  }

  const unmatchedSheets = wb.sheets
    .filter((sheet) => sheetsDetected[sheet.name] === undefined)
    .map((sheet) => sheet.name);

  const metadataSheets = [
    ...(roleMap.get("metadata") ?? []),
    ...(roleMap.get("evaluation") ?? []),
  ];

  const ventilationSheet = roleMap.get("ventilation")?.[0];
  const ventilation = ventilationSheet
    ? extractVentilationData(ventilationSheet)
    : {
        services: [],
        projectTotal: null,
        includeFlags: {} as QuoteIncludeFlags,
        bomRowsExtracted: 0,
      };

  const legacy = buildLegacyServices(roleMap, needsConfirmation);
  const services =
    ventilation.services.length > 0 ? ventilation.services : legacy.services;

  const bomRowsExtracted =
    ventilation.services.length > 0
      ? ventilation.bomRowsExtracted
      : legacy.bomRowsExtracted;

  const evaluationTotal = (roleMap.get("evaluation") ?? [])
    .map((sheet) => extractEvaluationTotal(sheet))
    .find((value): value is number => value !== null);

  const projectTitle =
    findMetadataValue(metadataSheets, "Nom du projet") ?? "";
  const clientName =
    findMetadataValue(metadataSheets, "Client (facture)") ??
    findMetadataValue(metadataSheets, "Client") ??
    "";
  const preparedByName =
    findMetadataValue(metadataSheets, "Charge projet") ??
    findMetadataValue(metadataSheets, "Charge de projet") ??
    "";

  if (projectTitle) {
    needsConfirmation.push({
      path: "projectTitle",
      reason: "Extracted from workbook metadata; confirm the project title",
      confidence: "medium",
      suggestion: projectTitle,
    });
  }

  if (clientName) {
    needsConfirmation.push({
      path: "clientName",
      reason: "Extracted from workbook metadata; confirm the client name",
      confidence: "medium",
      suggestion: clientName,
    });
  }

  const preparedBy = preparedByName ? [{ name: preparedByName }] : [];
  if (preparedByName) {
    needsConfirmation.push({
      path: "preparedBy",
      reason: "Extracted from workbook metadata; confirm the account owner",
      confidence: "medium",
      suggestion: preparedBy,
    });
  }

  const includeFlags =
    ventilation.services.length > 0
      ? ventilation.includeFlags
      : extractSummaryFlagsFromSheet(roleMap.get("ventilation")?.[0] ?? {
          name: "",
          rows: [],
          nRows: 0,
          nCols: 0,
        });

  let laborCategoriesExtracted = 0;
  if (services.length === 0) {
    const metadataLabor = (roleMap.get("evaluation") ?? [])
      .flatMap((sheet) => extractLaborCategories(sheet));
    if (metadataLabor.length > 0) {
      const laborSubtotal = metadataLabor.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      services.push({
        sectionNumber: 1,
        sectionName: "Main d'œuvre",
        description: "Main d'œuvre et catégories opérationnelles",
        bomItems: [],
        bomSubtotal: 0,
        laborCategories: metadataLabor,
        laborSubtotal,
        totalCost: laborSubtotal,
        layout: "itemized-with-price",
      });
      laborCategoriesExtracted = metadataLabor.length;
      needsConfirmation.push({
        path: "services.0.laborCategories",
        reason: "Labor categories were inferred from the workbook summary; confirm grouping",
        confidence: "medium",
      });
    }
  }

  for (const service of services) {
    needsConfirmation.push({
      path: `services.${service.sectionNumber - 1}.layout`,
      reason: "Default layout chosen from workbook structure; confirm with user",
      confidence: "medium",
      suggestion: "itemized-with-price",
    });
  }

  const computedSubtotal = services.reduce(
    (sum, service) => sum + service.totalCost,
    0,
  );
  const projectTotal =
    evaluationTotal ??
    ventilation.projectTotal ??
    computedSubtotal;

  const skeleton: Record<string, unknown> = {
    ...emptyQuoteDataDefaults(),
    projectTitle,
    clientName,
    preparedBy,
    proposal: {
      addressee: {
        name: clientName,
        company: clientName,
        address: "",
      },
      date: "",
      object: "",
      paragraphs: [],
    },
    services,
    projectSummary: {
      description: "",
      subtotal: computedSubtotal,
      totalProjectCost: projectTotal,
    },
  };

  if (includeFlags.includeMateriel === false) skeleton.includeMateriel = false;
  if (includeFlags.includeCable === false) skeleton.includeCable = false;
  if (includeFlags.includeQuincaillerie === false) {
    skeleton.includeQuincaillerie = false;
  }
  if (includeFlags.includeFraisDivers === false) {
    skeleton.includeFraisDivers = false;
  }
  if (includeFlags.includeMainDoeuvre === false) {
    skeleton.includeMainDoeuvre = false;
  }

  return {
    skeleton,
    needsConfirmation,
    stats: {
      sheetsDetected,
      bomRowsExtracted,
      laborCategoriesExtracted,
      totalSheetsRead: wb.sheets.length,
      matchedSheets: Object.keys(sheetsDetected).length,
      unmatchedSheets,
      serviceSectionsExtracted: services.length,
    },
  };
}
