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
  | "bom-materiel"
  | "bom-cable"
  | "bom-quincaillerie"
  | "labor-frais"
  | "labor-sous-traitant"
  | "labor-installation"
  | "summary";

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

const BOM_ROLES: readonly SheetRole[] = [
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

function detectSheetRole(normalized: string): SheetRole | null {
  if (/(palantir|page titre|cover)/.test(normalized)) return "metadata";
  if (/materiel|materiaux/.test(normalized)) return "bom-materiel";
  if (/cable/.test(normalized)) return "bom-cable";
  if (/quincaillerie/.test(normalized)) return "bom-quincaillerie";
  if (/frais (generaux|divers)/.test(normalized)) return "labor-frais";
  if (/sous(-| )traitant/.test(normalized)) return "labor-sous-traitant";
  if (/installation/.test(normalized)) return "labor-installation";
  if (/ventilation/.test(normalized)) return "summary";
  return null;
}

function toNormalizedString(v: CellValue): string {
  if (v === null || v === undefined) return "";
  return normalizeName(String(v));
}

function toTrimmedString(v: CellValue): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toNumber(v: CellValue): number {
  if (v === null || v === undefined || v === "") return Number.NaN;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const cleaned = String(v).replace(/[^0-9.\-,]/g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
}

function humanizeSheetName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function findBomHeaderRow(sheet: SheetData): { rowIndex: number; columns: Record<string, number> } | null {
  const limit = Math.min(20, sheet.rows.length);
  const keywordMap: Record<string, string[]> = {
    qty: ["qte", "quantite", "qty"],
    partNumber: ["part", "produit", "piece"],
    description: ["equipment", "description"],
    oem: ["manufacturier", "manufacturer"],
    unitPrice: ["unit cost", "prix unitaire", "vendant unit"],
    total: ["total cost"],
  };

  let best: { rowIndex: number; hits: number; columns: Record<string, number> } | null = null;

  for (let r = 0; r < limit; r++) {
    const row = sheet.rows[r] ?? [];
    const found: Record<string, number> = {};
    let hits = 0;

    for (let c = 0; c < row.length; c++) {
      const cell = toNormalizedString(row[c] ?? null);
      if (!cell) continue;

      for (const [field, keywords] of Object.entries(keywordMap)) {
        for (const kw of keywords) {
          if (cell.includes(kw)) {
            // Prefer first match; but for description, only accept if cell is explicitly "description"
            if (field === "description") {
              if (cell === "description" || found[field] === undefined) {
                if (cell === "description") {
                  found[field] = c;
                } else if (found[field] === undefined) {
                  found[field] = c;
                }
              }
            } else if (found[field] === undefined) {
              found[field] = c;
            }
            hits++;
            break;
          }
        }
      }
    }

    if (hits >= 3 && (!best || hits > best.hits)) {
      best = { rowIndex: r, hits, columns: found };
    }
  }

  if (!best) return null;
  return { rowIndex: best.rowIndex, columns: best.columns };
}

function extractBomItems(sheet: SheetData): BomItem[] {
  const header = findBomHeaderRow(sheet);
  if (!header) return [];
  const cols = header.columns;
  const items: BomItem[] = [];

  for (let r = header.rowIndex + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r] ?? [];
    if (row.length === 0) continue;

    const qtyCol = cols.qty;
    const partCol = cols.partNumber;

    const qty = qtyCol !== undefined ? toNumber(row[qtyCol] ?? null) : Number.NaN;
    const partNumber = partCol !== undefined ? toTrimmedString(row[partCol] ?? null) : "";

    if (!Number.isFinite(qty) || qty === 0) continue;
    if (!partNumber) continue;

    const description = cols.description !== undefined ? toTrimmedString(row[cols.description] ?? null) : "";
    const oem = cols.oem !== undefined ? toTrimmedString(row[cols.oem] ?? null) : "";
    const unitPriceRaw = cols.unitPrice !== undefined ? toNumber(row[cols.unitPrice] ?? null) : Number.NaN;
    const unitPrice = Number.isFinite(unitPriceRaw) ? unitPriceRaw : 0;
    const totalRaw = cols.total !== undefined ? toNumber(row[cols.total] ?? null) : Number.NaN;
    const total = Number.isFinite(totalRaw) ? totalRaw : qty * unitPrice;

    items.push({
      qty,
      partNumber,
      description,
      oem,
      unitPrice,
      total,
    });
  }

  return items;
}

function findTotalDollarColumn(sheet: SheetData): { rowIndex: number; col: number } | null {
  const limit = Math.min(20, sheet.rows.length);
  for (let r = 0; r < limit; r++) {
    const row = sheet.rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cell = toTrimmedString(row[c] ?? null).toLowerCase();
      if (!cell) continue;
      if (/total.*\$/.test(cell)) {
        return { rowIndex: r, col: c };
      }
    }
  }
  return null;
}

function extractLaborCategories(metadataSheet: SheetData): LaborCategory[] {
  const totalCol = findTotalDollarColumn(metadataSheet);
  const totalColIdx = totalCol?.col;
  const categories: LaborCategory[] = [];

  for (let r = 0; r < metadataSheet.rows.length; r++) {
    const row = metadataSheet.rows[r] ?? [];
    if (row.length === 0) continue;
    const first = toTrimmedString(row[0] ?? null);
    if (!first) continue;
    if (!LABOR_CODES.has(first)) continue;
    const description = toTrimmedString(row[1] ?? null);
    let amount = 0;
    if (totalColIdx !== undefined) {
      const v = toNumber(row[totalColIdx] ?? null);
      if (Number.isFinite(v)) amount = v;
    }
    categories.push({
      category: description || first,
      amount,
    });
  }

  return categories;
}

function findMetadataValue(sheet: SheetData, needle: string): string | null {
  const needleLc = needle.toLowerCase();
  for (let r = 0; r < sheet.rows.length; r++) {
    const row = sheet.rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cellRaw = row[c];
      if (cellRaw === null || cellRaw === undefined) continue;
      const cell = String(cellRaw).trim().toLowerCase();
      if (!cell) continue;
      if (cell === needleLc || cell.includes(needleLc)) {
        // Try right
        const right = row[c + 1];
        const rightStr = right === null || right === undefined ? "" : String(right).trim();
        if (rightStr) return rightStr;
        // Try below
        const below = sheet.rows[r + 1]?.[c];
        const belowStr = below === null || below === undefined ? "" : String(below).trim();
        if (belowStr) return belowStr;
      }
    }
  }
  return null;
}

function extractSummaryFlags(summarySheet: SheetData): {
  includeMateriel?: boolean;
  includeCable?: boolean;
  includeQuincaillerie?: boolean;
  includeFraisDivers?: boolean;
  includeMainDoeuvre?: boolean;
} {
  const flags: {
    includeMateriel?: boolean;
    includeCable?: boolean;
    includeQuincaillerie?: boolean;
    includeFraisDivers?: boolean;
    includeMainDoeuvre?: boolean;
  } = {};

  const labels: Array<{ key: keyof typeof flags; regex: RegExp }> = [
    { key: "includeMateriel", regex: /materiel|materiaux/ },
    { key: "includeCable", regex: /cable/ },
    { key: "includeQuincaillerie", regex: /quincaillerie/ },
    { key: "includeFraisDivers", regex: /frais divers/ },
    { key: "includeMainDoeuvre", regex: /main d.*oeuvre|main d.*?uvre/ },
  ];

  for (let r = 0; r < summarySheet.rows.length; r++) {
    const row = summarySheet.rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cellNorm = toNormalizedString(row[c] ?? null);
      if (!cellNorm) continue;
      for (const { key, regex } of labels) {
        if (flags[key] !== undefined) continue;
        if (regex.test(cellNorm)) {
          const next = row[c + 1];
          if (next === false) {
            flags[key] = false;
          }
          break;
        }
      }
    }
  }

  return flags;
}

function emptyQuoteDataDefaults(): Record<string, unknown> {
  return {
    projectTitle: "",
    clientName: "",
    preparedBy: [],
    documentType: "PROPOSITION",
    proposal: {
      addressee: { name: "", company: "" },
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

export function proposeSkeleton(wb: ParsedWorkbook): SkeletonResult {
  const needsConfirmation: NeedsConfirmation[] = [];
  const sheetsDetected: Record<string, string> = {};
  const roleMap = new Map<SheetRole, SheetData>();

  for (const sheet of wb.sheets) {
    const normalized = normalizeName(sheet.name);
    const role = detectSheetRole(normalized);
    if (role) {
      sheetsDetected[sheet.name] = role;
      if (!roleMap.has(role)) {
        roleMap.set(role, sheet);
      }
    }
  }

  // Build BOM service sections
  const services: ServiceSection[] = [];
  let bomRowsExtracted = 0;
  let sectionNumber = 1;

  for (const role of BOM_ROLES) {
    const sheet = roleMap.get(role);
    if (!sheet) continue;
    const bomItems = extractBomItems(sheet);
    bomRowsExtracted += bomItems.length;
    const bomSubtotal = bomItems.reduce((sum, it) => sum + (Number.isFinite(it.total) ? it.total : 0), 0);

    const section: ServiceSection = {
      sectionNumber,
      sectionName: humanizeSheetName(sheet.name),
      description: "",
      bomItems,
      bomSubtotal,
      laborCategories: [],
      laborSubtotal: 0,
      totalCost: bomSubtotal,
      layout: "itemized-with-price",
    };

    services.push(section);
    needsConfirmation.push({
      path: `services.${sectionNumber - 1}.layout`,
      reason: "Default layout chosen; confirm with user",
      confidence: "medium",
      suggestion: "itemized-with-price",
    });
    sectionNumber++;
  }

  // Labor extraction from metadata sheet
  let laborCategoriesExtracted = 0;
  const metadataSheet = roleMap.get("metadata");
  if (metadataSheet) {
    const laborCategories = extractLaborCategories(metadataSheet);
    laborCategoriesExtracted = laborCategories.length;
    if (laborCategories.length > 0) {
      if (services.length === 0) {
        // No BOM sections -- create a placeholder service 0 to hold labor
        services.push({
          sectionNumber: 1,
          sectionName: "Service 1",
          description: "",
          bomItems: [],
          bomSubtotal: 0,
          laborCategories: [],
          laborSubtotal: 0,
          totalCost: 0,
          layout: "itemized-with-price",
        });
        needsConfirmation.push({
          path: "services.0.layout",
          reason: "Default layout chosen; confirm with user",
          confidence: "medium",
          suggestion: "itemized-with-price",
        });
      }
      const laborSubtotal = laborCategories.reduce(
        (sum, lc) => sum + (Number.isFinite(lc.amount) ? lc.amount : 0),
        0,
      );
      services[0].laborCategories = laborCategories;
      services[0].laborSubtotal = laborSubtotal;
      services[0].totalCost = services[0].bomSubtotal + laborSubtotal;
      needsConfirmation.push({
        path: "services.0.laborCategories",
        reason: "Labor from Palantír attached to service 1; confirm grouping",
        confidence: "medium",
      });
    }
  }

  // Metadata scraping
  let projectTitle = "";
  let clientName = "";
  let preparedByName = "";

  if (metadataSheet) {
    const nomProjet = findMetadataValue(metadataSheet, "Nom du projet");
    const clientFacture = findMetadataValue(metadataSheet, "Client (facture)");
    const clientPlain = clientFacture ?? findMetadataValue(metadataSheet, "Client");
    const chargeProjet = findMetadataValue(metadataSheet, "Chargé projet");

    if (nomProjet) {
      projectTitle = nomProjet;
      needsConfirmation.push({
        path: "projectTitle",
        reason: "Extracted from Palantír; confirm with user",
        confidence: "medium",
        suggestion: nomProjet,
      });
    }
    if (clientPlain) {
      clientName = clientPlain;
      needsConfirmation.push({
        path: "clientName",
        reason: "Extracted from Palantír; confirm with user",
        confidence: "medium",
        suggestion: clientPlain,
      });
    }
    if (chargeProjet) {
      preparedByName = chargeProjet;
      needsConfirmation.push({
        path: "preparedBy",
        reason: "Extracted from Palantír; confirm with user",
        confidence: "medium",
        suggestion: [{ name: chargeProjet }],
      });
    }
  }

  const preparedBy = preparedByName ? [{ name: preparedByName }] : [];

  // Summary sheet inclusion flags
  let includeFlags: ReturnType<typeof extractSummaryFlags> = {};
  const summarySheet = roleMap.get("summary");
  if (summarySheet) {
    includeFlags = extractSummaryFlags(summarySheet);
  }

  // Compute totals
  const bomTotalSum = services.reduce((sum, s) => sum + s.bomSubtotal + s.laborSubtotal, 0);

  const defaults = emptyQuoteDataDefaults();
  const skeleton: Record<string, unknown> = {
    ...defaults,
    projectTitle,
    clientName,
    preparedBy,
    documentType: "PROPOSITION",
    proposal: {
      addressee: { name: clientName, company: clientName },
      date: "",
      object: "",
      paragraphs: [],
    },
    services,
    projectSummary: {
      description: "",
      subtotal: bomTotalSum,
      totalProjectCost: bomTotalSum,
    },
  };

  if (includeFlags.includeMateriel === false) skeleton.includeMateriel = false;
  if (includeFlags.includeCable === false) skeleton.includeCable = false;
  if (includeFlags.includeQuincaillerie === false) skeleton.includeQuincaillerie = false;
  if (includeFlags.includeFraisDivers === false) skeleton.includeFraisDivers = false;
  if (includeFlags.includeMainDoeuvre === false) skeleton.includeMainDoeuvre = false;

  return {
    skeleton,
    needsConfirmation,
    stats: {
      sheetsDetected,
      bomRowsExtracted,
      laborCategoriesExtracted,
    },
  };
}
