import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { quoteFiles, quotes, user } from "@/lib/db/schema";
import {
  loadCompanyMemory,
  loadCustomerAccountMemory,
  type CommercialDefaultMemory,
} from "@/lib/memory/durable-quote-memory";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import { assessQuoteProductionReadiness } from "@/lib/quote/render-readiness";
import type { QuoteData } from "@/lib/quote/schema";

import { contextFileAnalysisSchema } from "./context-file-analysis";
import type { NoxeCompanyProfile } from "./company-profile";

type QuoteRow = typeof quotes.$inferSelect;

type ContactMemory = {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type QuotePattern = {
  quoteId: string;
  updatedAt: string | null;
  customerName?: string;
  projectTitle?: string;
  totalProjectCost?: number;
  layouts: string[];
  optionalSections: string[];
  documentMode: "project-proposal" | "service-agreement";
  paymentTermsPresent: boolean;
  exclusionsPresent: boolean;
};

type ContextAttachmentMemory = {
  fileId: string;
  filename: string;
  mediaType: string;
  analyzedAt: string | null;
  summary?: string;
  evidenceQuotes: string[];
  quoteFieldHints: Array<{
    label: string;
    value: string;
    confidence: "low" | "medium" | "high";
    quotePathHint?: string;
  }>;
  needsConfirmation: string[];
};

export type QuoteAgentPromptContext = {
  companyProfile: NoxeCompanyProfile;
  companyCommercialDefaults: CommercialDefaultMemory[];
  sourcePriority: Array<{
    source: string;
    priority:
      | "authoritative"
      | "strong_evidence"
      | "working_state"
      | "suggestive"
      | "style_only";
    usage: string;
  }>;
  quoteState: {
    renderReadiness: "ready" | "blocked";
    workflowStage: "ingest" | "confirm" | "compose" | "ready";
    discoveryChecklist: string[];
    blockers: string[];
    blockingIssues: string[];
    qualityWarnings: string[];
    customerName?: string;
    projectTitle?: string;
    totalProjectCost?: number;
    documentMode: "project-proposal" | "service-agreement";
    preparedBy: string[];
    preparedFor: string[];
    optionalSections: string[];
    commercialProfile: {
      equipmentHeavy: boolean;
      assumptionsLikelyNeeded: boolean;
      paymentTermsPresent: boolean;
      exclusionsPresent: boolean;
      notesPresent: boolean;
      specialConditionsPresent: boolean;
      recommendedPaymentSchedule?: string;
    };
    serviceSummaries: Array<{
      sectionNumber: number;
      sectionName: string;
      layout?: string;
      bomItems: number;
      laborCategories: number;
      totalCost?: number;
    }>;
  };
  contextAttachments: ContextAttachmentMemory[];
  salesRepContext: {
    signedInUser?: {
      name?: string;
      email?: string;
    };
    recurringPreparedBy: string[];
    recurringContactOptions: ContactMemory[];
    recentQuotePatterns: QuotePattern[];
  };
  customerMemory: null | {
    accountId?: string;
    customerName: string;
    seenInQuotes: number;
    preferredLang?: "fr" | "en";
    recentProjects: Array<{
      projectTitle?: string;
      updatedAt: string | null;
      totalProjectCost?: number;
    }>;
    contactOptions: ContactMemory[];
    addresses: string[];
    aliases: string[];
    commercialDefaults: CommercialDefaultMemory[];
    optionalSectionsUsed: string[];
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isMeaningfulText(value: string | undefined): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ![
    "",
    "-",
    "—",
    "n/a",
    "na",
    "unknown",
    "inconnu",
    "je ne sais pas encore",
  ].includes(normalized);
}

function sanitizeText(value: string | undefined) {
  return isMeaningfulText(value) ? value : undefined;
}

function normalizeKey(value: string | undefined) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function dedupeStrings(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalizeKey(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

function dedupeContacts(values: ContactMemory[]) {
  const seen = new Set<string>();
  const output: ContactMemory[] = [];

  for (const value of values) {
    if (!Object.values(value).some(Boolean)) continue;

    const key = JSON.stringify({
      name: normalizeKey(value.name),
      title: normalizeKey(value.title),
      company: normalizeKey(value.company),
      email: normalizeKey(value.email),
      phone: normalizeKey(value.phone),
      address: normalizeKey(value.address),
    });

    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }

  return output;
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function getNestedRecord(
  root: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!root) return null;
  return asRecord(root[key]);
}

function getPersonNames(
  root: Record<string, unknown> | null,
  key: string,
): string[] {
  if (!root) return [];
  const value = root[key];
  if (!Array.isArray(value)) return [];

  return dedupeStrings(
    value.map((item) => {
      const row = asRecord(item);
      if (!row) return undefined;
      const name = sanitizeText(asString(row.name));
      const title = sanitizeText(asString(row.title));
      if (name && title) return `${name} (${title})`;
      return name ?? title;
    }),
  );
}

function getEnabledOptionalSections(data: Partial<QuoteData>) {
  const toggles = [
    ["includeAboutUs", "About Us"],
    ["includeCulture", "Culture"],
    ["includeCeoMessage", "Leadership Note"],
    ["includeTeam", "Team Presentation"],
    ["includePartners", "Partners"],
    ["includeTermsAndConditions", "Terms and Conditions"],
  ] as const;

  return toggles
    .filter(([key]) => data[key] === true)
    .map(([, label]) => label);
}

function readContactInfo(root: Record<string, unknown> | null): ContactMemory | null {
  if (!root) return null;
  const record = getNestedRecord(root, "contactInfo");
  if (!record) return null;

  const contact: ContactMemory = {
    name: sanitizeText(asString(record.name)),
    title: sanitizeText(asString(record.title)),
    company: sanitizeText(asString(record.company)),
    email: sanitizeText(asString(record.email)),
    phone: sanitizeText(asString(record.phone)),
    address: sanitizeText(asString(record.address)),
  };

  return Object.values(contact).some(Boolean) ? contact : null;
}

function getCustomerName(
  data: Partial<QuoteData>,
  rawData: Record<string, unknown> | null,
) {
  const proposal = getNestedRecord(rawData, "proposal");
  const addressee = getNestedRecord(proposal, "addressee");
  const contact = readContactInfo(rawData);

  return (
    sanitizeText(data.clientName) ??
    sanitizeText(asString(addressee?.company)) ??
    sanitizeText(asString(addressee?.name)) ??
    contact?.company ??
    contact?.name
  );
}

function getPreparedFor(
  data: Partial<QuoteData>,
  rawData: Record<string, unknown> | null,
) {
  return data.preparedFor
    ? dedupeStrings(
        data.preparedFor.map((person) =>
          sanitizeText(
            [person.name, "company" in person ? asString(person.company) : undefined]
              .filter(Boolean)
              .join(" / "),
          ),
        ),
      )
    : getPersonNames(rawData, "preparedFor");
}

function summarizeServices(data: Partial<QuoteData>) {
  return (data.services ?? []).slice(0, 8).map((service, index) => ({
    sectionNumber: service.sectionNumber ?? index + 1,
    sectionName: sanitizeText(service.sectionName) ?? `Section ${index + 1}`,
    layout: sanitizeText(service.layout),
    bomItems: Array.isArray(service.bomItems) ? service.bomItems.length : 0,
    laborCategories: Array.isArray(service.laborCategories)
      ? service.laborCategories.length
      : 0,
    totalCost: asNumber(service.totalCost),
  }));
}

function hasMeaningfulItems(values: Array<string | undefined> | undefined) {
  return values?.some((value) => isMeaningfulText(value)) ?? false;
}

function isEquipmentHeavyQuote(data: Partial<QuoteData>) {
  const services = data.services ?? [];
  const bomItems = services.reduce(
    (count, service) => count + (service.bomItems?.length ?? 0),
    0,
  );
  return bomItems > 0;
}

function inferDocumentMode(
  title: string | undefined,
  data: Partial<QuoteData>,
): "project-proposal" | "service-agreement" {
  const titleKey = normalizeKey(title);
  const lowerServices = (data.services ?? []).map((service) =>
    normalizeKey(service.sectionName),
  );

  if (
    titleKey.includes("contrat") ||
    titleKey.includes("entente") ||
    titleKey.includes("maintenance") ||
    titleKey.includes("msa") ||
    titleKey.includes("psa") ||
    lowerServices.some((value) =>
      value.includes("service") || value.includes("maintenance"),
    )
  ) {
    return "service-agreement";
  }

  return "project-proposal";
}

function detectWorkflowStage({
  data,
  readiness,
  attachmentCount,
}: {
  data: Partial<QuoteData>;
  readiness: ReturnType<typeof assessQuoteProductionReadiness>;
  attachmentCount: number;
}): "ingest" | "confirm" | "compose" | "ready" {
  if ((data.services?.length ?? 0) === 0 && attachmentCount === 0) {
    return "ingest";
  }

  if (readiness.renderReadiness === "ready") {
    return "ready";
  }

  if (readiness.blockers.length > 0) {
    return "confirm";
  }

  return "compose";
}

function shouldSuggestAssumptionsSection(data: Partial<QuoteData>) {
  const specialConditions = data.specialConditions ?? [];
  const notes = data.notes ?? [];

  if (
    [...specialConditions, ...notes].some((value) =>
      normalizeKey(value).includes("hypoth"),
    )
  ) {
    return false;
  }

  return (
    !sanitizeText(data.projectSummary?.description) ||
    !sanitizeText(data.contactInfo?.company)
  );
}

function buildDiscoveryChecklist({
  data,
  documentMode,
  preparedBy,
  preparedFor,
}: {
  data: Partial<QuoteData>;
  documentMode: "project-proposal" | "service-agreement";
  preparedBy: string[];
  preparedFor: string[];
}) {
  const checklist: string[] = [];

  if (preparedBy.length === 0) {
    checklist.push("Validate who is preparing the quote and which identity/title should appear on the PDF.");
  }

  if (preparedFor.length === 0) {
    checklist.push("Validate who the quote is prepared for and which customer-facing recipient should appear on the cover.");
  }

  if (!sanitizeText(data.contactInfo?.name) || !sanitizeText(data.contactInfo?.company)) {
    checklist.push("Validate the customer contact block for the final PDF.");
  }

  if (!sanitizeText(data.contactInfo?.email) || !sanitizeText(data.contactInfo?.phone)) {
    checklist.push("Validate the customer contact email and phone before render.");
  }

  if (!sanitizeText(data.projectSummary?.description)) {
    checklist.push("Validate the project summary or assumptions so the quote does not read like a draft.");
  }

  if (!hasMeaningfulItems(data.paymentTerms)) {
    checklist.push("Confirm the payment schedule in the first discovery pass.");
  }

  if (!hasMeaningfulItems(data.exclusions)) {
    checklist.push("Confirm the exclusions in the first discovery pass.");
  }

  if (
    documentMode === "project-proposal" &&
    getEnabledOptionalSections(data).length === 0
  ) {
    checklist.push("Validate whether brochure-style optional sections should be included.");
  }

  if ((data.services ?? []).some((service) => !sanitizeText(service.layout))) {
    checklist.push("Validate the preferred service layout for detailed sections.");
  }

  return checklist;
}

function pickRecentQuotePattern(row: QuoteRow): QuotePattern {
  const data = normalizeQuoteData(row.data as Partial<QuoteData>);
  const rawData = asRecord(row.data);
  const paymentTermsPresent = hasMeaningfulItems(data.paymentTerms);
  const exclusionsPresent = hasMeaningfulItems(data.exclusions);

  return {
    quoteId: row.id,
    updatedAt: formatDate(row.updatedAt),
    customerName: getCustomerName(data, rawData),
    projectTitle: sanitizeText(data.projectTitle),
    totalProjectCost: asNumber(data.projectSummary?.totalProjectCost),
    layouts: dedupeStrings(
      (data.services ?? []).map((service) => sanitizeText(service.layout)),
    ),
    optionalSections: getEnabledOptionalSections(data),
    documentMode: inferDocumentMode(data.projectTitle, data),
    paymentTermsPresent,
    exclusionsPresent,
  };
}

function rankPreparedBy(rows: QuoteRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const data = normalizeQuoteData(row.data as Partial<QuoteData>);
    const rawData = asRecord(row.data);
    const preparedBy = data.preparedBy?.map((person) => sanitizeText(person.name)) ??
      getPersonNames(rawData, "preparedBy");

    for (const value of preparedBy) {
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value)
    .slice(0, 4);
}

function summarizeContextAttachmentAnalysis(analysis: unknown) {
  const parsed = contextFileAnalysisSchema.safeParse(analysis);
  if (!parsed.success) return null;

  return {
    evidenceQuotes: parsed.data.evidenceQuotes.slice(0, 4),
    summary: sanitizeText(parsed.data.summary),
    quoteFieldHints: parsed.data.quoteFieldHints.slice(0, 6),
    needsConfirmation: parsed.data.needsConfirmation.slice(0, 6),
  };
}

function rankContacts(rows: QuoteRow[]) {
  const contacts = rows
    .map((row) => readContactInfo(asRecord(row.data)))
    .filter((value): value is ContactMemory => value !== null);

  return dedupeContacts(contacts).slice(0, 3);
}

function buildCustomerMemory(customerName: string, rows: QuoteRow[]) {
  if (rows.length === 0) return null;

  const recentProjects = rows.slice(0, 4).map((row) => {
    const data = normalizeQuoteData(row.data as Partial<QuoteData>);
    return {
      projectTitle: sanitizeText(data.projectTitle),
      updatedAt: formatDate(row.updatedAt),
      totalProjectCost: asNumber(data.projectSummary?.totalProjectCost),
    };
  });

  const contactOptions = dedupeContacts(
    rows
      .map((row) => readContactInfo(asRecord(row.data)))
      .filter((value): value is ContactMemory => value !== null),
  ).slice(0, 4);

  const addresses = dedupeStrings(
    rows.map((row) => {
      const rawData = asRecord(row.data);
      const proposal = getNestedRecord(rawData, "proposal");
      const addressee = getNestedRecord(proposal, "addressee");
      return (
        sanitizeText(asString(addressee?.address)) ??
        readContactInfo(rawData)?.address
      );
    }),
  ).slice(0, 4);

  const optionalSectionsUsed = dedupeStrings(
    rows.flatMap((row) => getEnabledOptionalSections(
      normalizeQuoteData(row.data as Partial<QuoteData>),
    )),
  ).slice(0, 6);

  return {
    customerName,
    seenInQuotes: rows.length,
    recentProjects,
    contactOptions,
    addresses,
    optionalSectionsUsed,
  };
}

export async function buildQuoteAgentPromptContext({
  quote,
  userId,
}: {
  quote: QuoteRow;
  userId: string;
}): Promise<QuoteAgentPromptContext> {
  const data = normalizeQuoteData(quote.data as Partial<QuoteData>);
  const rawData = asRecord(quote.data);
  const customerName = getCustomerName(data, rawData);
  const customerKey = normalizeKey(customerName);
  const [companyMemory, customerAccountMemory] = await Promise.all([
    loadCompanyMemory(),
    loadCustomerAccountMemory(customerName),
  ]);

  const [signedInUser] = await db
    .select({
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const recentQuotes = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.userId, userId), ne(quotes.id, quote.id)))
    .orderBy(desc(quotes.updatedAt))
    .limit(8);

  const relatedCustomerQuotes = customerKey
    ? recentQuotes.filter((row) => {
        const rowData = normalizeQuoteData(row.data as Partial<QuoteData>);
        return normalizeKey(getCustomerName(rowData, asRecord(row.data))) === customerKey;
      })
    : [];
  const recentContextFiles = await db
    .select({
      id: quoteFiles.id,
      filename: quoteFiles.filename,
      mediaType: quoteFiles.mediaType,
      analyzedAt: quoteFiles.analyzedAt,
      analysis: quoteFiles.analysis,
    })
    .from(quoteFiles)
    .where(
      and(eq(quoteFiles.quoteId, quote.id), eq(quoteFiles.kind, "context")),
    )
    .orderBy(desc(quoteFiles.createdAt))
    .limit(6);

  const readiness = assessQuoteProductionReadiness(data);
  const documentMode = inferDocumentMode(quote.title, data);
  const equipmentHeavy = isEquipmentHeavyQuote(data);
  const preparedByFromQuote = dedupeStrings([
    ...(data.preparedBy?.map((person) => sanitizeText(person.name)) ?? []),
    ...getPersonNames(rawData, "preparedBy"),
  ]);
  const qualityWarnings = [
    ...readiness.qualityWarnings,
  ];
  const paymentTermsPresent = hasMeaningfulItems(data.paymentTerms);
  const exclusionsPresent = hasMeaningfulItems(data.exclusions);
  const notesPresent = hasMeaningfulItems(data.notes);
  const specialConditionsPresent = hasMeaningfulItems(data.specialConditions);
  const workflowStage = detectWorkflowStage({
    data,
    readiness,
    attachmentCount: recentContextFiles.length,
  });

  return {
    companyProfile: companyMemory.companyProfile,
    companyCommercialDefaults: companyMemory.companyCommercialDefaults,
    sourcePriority: [
      {
        source: "quote_state.renderReadiness + quote_state.blockingIssues",
        priority: "authoritative",
        usage:
          "Use as the hard render gate. Never treat blocked quotes as ready.",
      },
      {
        source: "attachment evidenceQuotes + workbook facts + explicit user answers",
        priority: "strong_evidence",
        usage:
          "Use these to patch low-risk facts or ask targeted confirmation questions.",
      },
      {
        source: "current quote working state",
        priority: "working_state",
        usage:
          "Patch this exact shape, but do not treat placeholders as confirmed truth.",
      },
      {
        source: "customer_memory + sales_rep_memory",
        priority: "suggestive",
        usage:
          "Use as defaults, options, or reminders. Do not silently overwrite stronger evidence.",
      },
      {
        source: "company_commercial_defaults + customer_memory.commercialDefaults",
        priority: "suggestive",
        usage:
          "Use these before inventing exclusions or payment terms. They are approved defaults, not automatic overrides.",
      },
      {
        source: "company_profile",
        priority: "style_only",
        usage:
          "Use only for tone, structure, and approved commercial posture. Never for customer facts.",
      },
    ],
    quoteState: {
      renderReadiness: readiness.renderReadiness,
      workflowStage,
      discoveryChecklist: buildDiscoveryChecklist({
        data,
        documentMode,
        preparedBy: preparedByFromQuote,
        preparedFor: getPreparedFor(data, rawData),
      }),
      blockers: readiness.blockers,
      blockingIssues: readiness.blockingIssues,
      qualityWarnings,
      customerName,
      projectTitle: sanitizeText(data.projectTitle),
      totalProjectCost: asNumber(data.projectSummary?.totalProjectCost),
      documentMode,
      preparedBy: preparedByFromQuote,
      preparedFor: getPreparedFor(data, rawData),
      optionalSections: getEnabledOptionalSections(data),
      commercialProfile: {
        equipmentHeavy,
        assumptionsLikelyNeeded: shouldSuggestAssumptionsSection(data),
        paymentTermsPresent,
        exclusionsPresent,
        notesPresent,
        specialConditionsPresent,
        recommendedPaymentSchedule:
          !paymentTermsPresent
            ? equipmentHeavy
              ? "35 % à la signature, 15 % à la commande du matériel, 40 % en cours d'installation, 10 % à la fin des travaux"
              : "35 % à la signature, 65 % selon l'avancement des travaux"
            : undefined,
      },
      serviceSummaries: summarizeServices(data),
    },
    contextAttachments: recentContextFiles.map((file) => {
      const analysis = summarizeContextAttachmentAnalysis(file.analysis);
      return {
        fileId: file.id,
        filename: file.filename,
        mediaType: file.mediaType,
        analyzedAt: formatDate(file.analyzedAt),
        summary: analysis?.summary,
        evidenceQuotes: analysis?.evidenceQuotes ?? [],
        quoteFieldHints: analysis?.quoteFieldHints ?? [],
        needsConfirmation: analysis?.needsConfirmation ?? [],
      };
    }),
    salesRepContext: {
      signedInUser: signedInUser
        ? {
            name: sanitizeText(signedInUser.name ?? undefined),
            email: sanitizeText(signedInUser.email ?? undefined),
          }
        : undefined,
      recurringPreparedBy: rankPreparedBy(recentQuotes),
      recurringContactOptions: rankContacts(recentQuotes),
      recentQuotePatterns: recentQuotes.slice(0, 4).map(pickRecentQuotePattern),
    },
    customerMemory: customerName
      ? (() => {
          const recentMemory = buildCustomerMemory(customerName, relatedCustomerQuotes);
          if (!recentMemory && !customerAccountMemory) {
            return null;
          }

          return {
            accountId: customerAccountMemory?.accountId,
            customerName:
              customerAccountMemory?.displayName ?? recentMemory?.customerName ?? customerName,
            seenInQuotes: recentMemory?.seenInQuotes ?? relatedCustomerQuotes.length,
            preferredLang: customerAccountMemory?.preferredLang,
            recentProjects: recentMemory?.recentProjects ?? [],
            contactOptions: dedupeContacts([
              ...(customerAccountMemory?.contacts ?? []),
              ...(recentMemory?.contactOptions ?? []),
            ]).slice(0, 4),
            addresses: dedupeStrings([
              ...(customerAccountMemory?.addresses ?? []),
              ...(recentMemory?.addresses ?? []),
            ]).slice(0, 6),
            aliases: customerAccountMemory?.aliases ?? [],
            commercialDefaults: customerAccountMemory?.commercialDefaults ?? [],
            optionalSectionsUsed: dedupeStrings([
              ...(recentMemory?.optionalSectionsUsed ?? []),
            ]).slice(0, 6),
          };
        })()
      : null,
  };
}
