import { and, desc, eq } from "drizzle-orm";

import { noxeCompanyProfile, type NoxeCompanyProfile } from "@/lib/agent/company-profile";
import { noxeQuotePlaybook } from "@/lib/agent/quote-playbook";
import { db } from "@/lib/db";
import {
  commercialDefaults,
  companyProfiles,
  customerAccounts,
  customerContacts,
  type Quote,
} from "@/lib/db/schema";
import { assessQuoteProductionReadiness } from "@/lib/quote/render-readiness";
import type { QuoteData } from "@/lib/quote/schema";
import { newId } from "@/lib/util/ids";

const DEFAULT_COMPANY_PROFILE_ID = "company_profile_noxe";
const DEFAULT_COMPANY_SLUG = "noxe";

export type DurableContactMemory = {
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type CommercialDefaultMemory = {
  label: string;
  documentMode?: "project-proposal" | "service-agreement";
  paymentTerms: string[];
  exclusions: string[];
  specialConditions: string[];
  notes: string[];
  sourceType: "seed" | "quote";
  approvedAt: string | null;
  sourceQuoteId?: string;
};

export type CustomerAccountMemory = {
  accountId: string;
  displayName: string;
  legalName?: string;
  preferredLang?: "fr" | "en";
  aliases: string[];
  addresses: string[];
  contacts: DurableContactMemory[];
  commercialDefaults: CommercialDefaultMemory[];
};

export type CompanyMemory = {
  companyProfile: NoxeCompanyProfile;
  companyCommercialDefaults: CommercialDefaultMemory[];
};

function normalizeKey(value: string | undefined) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sanitizeText(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.toLowerCase();
  if (
    normalized === "-" ||
    normalized === "—" ||
    normalized === "n/a" ||
    normalized === "na" ||
    normalized === "unknown" ||
    normalized === "inconnu" ||
    normalized === "je ne sais pas encore"
  ) {
    return undefined;
  }
  return trimmed;
}

function dedupeStrings(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = sanitizeText(value);
    if (!cleaned) continue;
    const key = normalizeKey(cleaned);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function normalizeList(values: string[] | undefined) {
  return dedupeStrings(values ?? []);
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

function getCustomerName(data: Partial<QuoteData>) {
  return (
    sanitizeText(data.clientName) ??
    sanitizeText(data.contactInfo?.company) ??
    sanitizeText(data.contactInfo?.name) ??
    sanitizeText(data.preparedFor?.[0]?.name)
  );
}

function getPrimaryContact(data: Partial<QuoteData>): DurableContactMemory | null {
  const contact: DurableContactMemory = {
    name: sanitizeText(data.contactInfo?.name) ?? sanitizeText(data.preparedFor?.[0]?.name),
    company:
      sanitizeText(data.contactInfo?.company) ?? sanitizeText(data.clientName),
    email: sanitizeText(data.contactInfo?.email),
    phone: sanitizeText(data.contactInfo?.phone),
  };

  return Object.values(contact).some(Boolean) ? contact : null;
}

function parseCompanyProfile(value: unknown): NoxeCompanyProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Partial<NoxeCompanyProfile>;
  if (
    typeof candidate.companyName !== "string" ||
    typeof candidate.starterStory !== "string" ||
    !Array.isArray(candidate.differentiators) ||
    !Array.isArray(candidate.voice) ||
    !Array.isArray(candidate.brochureGuidance) ||
    !Array.isArray(candidate.commercialGuidance) ||
    !Array.isArray(candidate.neverInvent)
  ) {
    return null;
  }

  return {
    companyName: candidate.companyName,
    starterStory: candidate.starterStory,
    differentiators: candidate.differentiators.filter(
      (value): value is string => typeof value === "string",
    ),
    voice: candidate.voice.filter(
      (value): value is string => typeof value === "string",
    ),
    brochureGuidance: candidate.brochureGuidance.filter(
      (value): value is string => typeof value === "string",
    ),
    commercialGuidance: candidate.commercialGuidance.filter(
      (value): value is string => typeof value === "string",
    ),
    neverInvent: candidate.neverInvent.filter(
      (value): value is string => typeof value === "string",
    ),
  };
}

async function ensureCompanySeeded() {
  const [existingProfile] = await db
    .select()
    .from(companyProfiles)
    .where(eq(companyProfiles.slug, DEFAULT_COMPANY_SLUG))
    .limit(1);

  const companyProfileId = existingProfile?.id ?? DEFAULT_COMPANY_PROFILE_ID;

  if (!existingProfile) {
    await db.insert(companyProfiles).values({
      id: companyProfileId,
      slug: DEFAULT_COMPANY_SLUG,
      companyName: noxeCompanyProfile.companyName,
      profile: noxeCompanyProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const existingDefaults = await db
    .select({
      id: commercialDefaults.id,
      label: commercialDefaults.label,
    })
    .from(commercialDefaults)
    .where(
      and(
        eq(commercialDefaults.scope, "company"),
        eq(commercialDefaults.companyProfileId, companyProfileId),
      ),
    );

  const existingLabels = new Set(existingDefaults.map((row) => row.label));
  const now = new Date();
  const seedDefaults: Array<Omit<typeof commercialDefaults.$inferInsert, "id"> & { id: string }> = [
    {
      id: "commercial_default_company_equipment_heavy",
      scope: "company",
      companyProfileId,
      label: "equipment-heavy staged billing",
      documentMode: "project-proposal",
      paymentTerms: [
        "35 % à la signature",
        "15 % à la commande du matériel",
        "40 % en cours d'installation",
        "10 % à la fin des travaux",
      ],
      exclusions: noxeQuotePlaybook.exclusionsChecklist,
      specialConditions: [],
      notes: [],
      sourceType: "seed",
      sourceQuoteId: null,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
      customerAccountId: null,
    },
    {
      id: "commercial_default_company_progress_billing",
      scope: "company",
      companyProfileId,
      label: "simplified progress billing",
      documentMode: "project-proposal",
      paymentTerms: [
        "35 % à la signature",
        "65 % selon l'avancement des travaux",
      ],
      exclusions: noxeQuotePlaybook.exclusionsChecklist,
      specialConditions: [],
      notes: [],
      sourceType: "seed",
      sourceQuoteId: null,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
      customerAccountId: null,
    },
    {
      id: "commercial_default_company_service_agreement",
      scope: "company",
      companyProfileId,
      label: "service agreement recurring billing",
      documentMode: "service-agreement",
      paymentTerms: [
        "Facturation mensuelle",
        "NET 30",
        "Révision annuelle au besoin",
      ],
      exclusions: noxeQuotePlaybook.exclusionsChecklist,
      specialConditions: [],
      notes: [],
      sourceType: "seed",
      sourceQuoteId: null,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
      customerAccountId: null,
    },
  ];

  const missingDefaults = seedDefaults.filter(
    (row) => !existingLabels.has(row.label),
  );
  if (missingDefaults.length > 0) {
    await db.insert(commercialDefaults).values(missingDefaults);
  }

  return companyProfileId;
}

function toCommercialDefaultMemory(
  row: typeof commercialDefaults.$inferSelect,
): CommercialDefaultMemory {
  return {
    label: row.label,
    documentMode: row.documentMode ?? undefined,
    paymentTerms: normalizeList(row.paymentTerms as string[] | undefined),
    exclusions: normalizeList(row.exclusions as string[] | undefined),
    specialConditions: normalizeList(
      row.specialConditions as string[] | undefined,
    ),
    notes: normalizeList(row.notes as string[] | undefined),
    sourceType: row.sourceType,
    approvedAt: toIsoDate(row.approvedAt),
    sourceQuoteId: row.sourceQuoteId ?? undefined,
  };
}

export async function loadCompanyMemory(): Promise<CompanyMemory> {
  const companyProfileId = await ensureCompanySeeded();

  const [profileRow] = await db
    .select()
    .from(companyProfiles)
    .where(eq(companyProfiles.id, companyProfileId))
    .limit(1);

  const defaultsRows = await db
    .select()
    .from(commercialDefaults)
    .where(
      and(
        eq(commercialDefaults.scope, "company"),
        eq(commercialDefaults.companyProfileId, companyProfileId),
      ),
    )
    .orderBy(desc(commercialDefaults.approvedAt), desc(commercialDefaults.updatedAt));

  return {
    companyProfile: parseCompanyProfile(profileRow?.profile) ?? noxeCompanyProfile,
    companyCommercialDefaults: defaultsRows.map(toCommercialDefaultMemory),
  };
}

export async function loadCustomerAccountMemory(
  customerName: string | undefined,
): Promise<CustomerAccountMemory | null> {
  const normalizedCustomerName = normalizeKey(customerName);
  if (!normalizedCustomerName) return null;

  const [accountRow] = await db
    .select()
    .from(customerAccounts)
    .where(eq(customerAccounts.normalizedName, normalizedCustomerName))
    .limit(1);

  if (!accountRow) return null;

  const contactsRows = await db
    .select()
    .from(customerContacts)
    .where(eq(customerContacts.customerAccountId, accountRow.id))
    .orderBy(desc(customerContacts.isPrimary), desc(customerContacts.updatedAt));

  const defaultsRows = await db
    .select()
    .from(commercialDefaults)
    .where(
      and(
        eq(commercialDefaults.scope, "customer"),
        eq(commercialDefaults.customerAccountId, accountRow.id),
      ),
    )
    .orderBy(desc(commercialDefaults.approvedAt), desc(commercialDefaults.updatedAt))
    .limit(3);

  const contacts = contactsRows.map((contact) => ({
    name: sanitizeText(contact.name),
    title: sanitizeText(contact.title ?? undefined),
    company: sanitizeText(contact.company ?? undefined),
    email: sanitizeText(contact.email ?? undefined),
    phone: sanitizeText(contact.phone ?? undefined),
    address: sanitizeText(contact.address ?? undefined),
  }));

  const addresses = dedupeStrings([
    sanitizeText(accountRow.billingAddress ?? undefined),
    ...((accountRow.siteAddresses as string[] | undefined) ?? []),
    ...contacts.map((contact) => contact.address),
  ]);

  return {
    accountId: accountRow.id,
    displayName: accountRow.displayName,
    legalName: sanitizeText(accountRow.legalName ?? undefined),
    preferredLang: accountRow.preferredLang ?? undefined,
    aliases: dedupeStrings((accountRow.aliases as string[] | undefined) ?? []),
    addresses,
    contacts,
    commercialDefaults: defaultsRows.map(toCommercialDefaultMemory),
  };
}

export async function syncDurableMemoryFromQuote({
  quote,
  data,
}: {
  quote: Pick<Quote, "id" | "title" | "lang">;
  data: Partial<QuoteData>;
}) {
  await ensureCompanySeeded();

  const customerName = getCustomerName(data);
  const normalizedCustomerName = normalizeKey(customerName);
  if (!normalizedCustomerName || !customerName) {
    return;
  }

  const [existingAccount] = await db
    .select()
    .from(customerAccounts)
    .where(eq(customerAccounts.normalizedName, normalizedCustomerName))
    .limit(1);

  const now = new Date();
  const primaryContact = getPrimaryContact(data);
  const nextAliases = dedupeStrings([
    customerName,
    sanitizeText(existingAccount?.displayName),
    ...((existingAccount?.aliases as string[] | undefined) ?? []),
  ]);

  const [account] = existingAccount
    ? await db
        .update(customerAccounts)
        .set({
          displayName: customerName,
          legalName:
            sanitizeText(existingAccount.legalName ?? undefined) ??
            sanitizeText(data.clientName),
          preferredLang: quote.lang,
          aliases: nextAliases,
          sourceQuoteId: quote.id,
          lastConfirmedAt: now,
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, existingAccount.id))
        .returning()
    : await db
        .insert(customerAccounts)
        .values({
          id: newId(),
          normalizedName: normalizedCustomerName,
          displayName: customerName,
          legalName: sanitizeText(data.clientName),
          preferredLang: quote.lang,
          aliases: nextAliases,
          siteAddresses: [],
          sourceQuoteId: quote.id,
          lastConfirmedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

  if (primaryContact) {
    const existingContacts = await db
      .select()
      .from(customerContacts)
      .where(eq(customerContacts.customerAccountId, account.id));

    const normalizedContactName = normalizeKey(primaryContact.name);
    const existingContact = existingContacts.find((contact) => {
      if (primaryContact.email && contact.email === primaryContact.email) {
        return true;
      }

      if (normalizedContactName && contact.normalizedName !== normalizedContactName) {
        return false;
      }

      if (primaryContact.phone && contact.phone && contact.phone !== primaryContact.phone) {
        return false;
      }

      return Boolean(normalizedContactName);
    });

    if (existingContact) {
      await db
        .update(customerContacts)
        .set({
          name: primaryContact.name ?? existingContact.name,
          title: primaryContact.title ?? existingContact.title,
          company: primaryContact.company ?? existingContact.company,
          email: primaryContact.email ?? existingContact.email,
          phone: primaryContact.phone ?? existingContact.phone,
          address: primaryContact.address ?? existingContact.address,
          isPrimary: true,
          sourceQuoteId: quote.id,
          lastConfirmedAt: now,
          updatedAt: now,
        })
        .where(eq(customerContacts.id, existingContact.id));
    } else {
      await db.insert(customerContacts).values({
        id: newId(),
        customerAccountId: account.id,
        normalizedName: normalizedContactName || normalizeKey(customerName),
        name: primaryContact.name ?? customerName,
        title: primaryContact.title,
        company: primaryContact.company,
        email: primaryContact.email,
        phone: primaryContact.phone,
        address: primaryContact.address,
        isPrimary: true,
        sourceQuoteId: quote.id,
        lastConfirmedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const readiness = assessQuoteProductionReadiness(data);
  const paymentTerms = normalizeList(data.paymentTerms);
  const exclusions = normalizeList(data.exclusions);

  if (
    readiness.renderReadiness !== "ready" ||
    paymentTerms.length === 0 ||
    exclusions.length === 0
  ) {
    return;
  }

  const [existingDefault] = await db
    .select()
    .from(commercialDefaults)
    .where(
      and(
        eq(commercialDefaults.scope, "customer"),
        eq(commercialDefaults.customerAccountId, account.id),
        eq(commercialDefaults.sourceQuoteId, quote.id),
      ),
    )
    .limit(1);

  const commercialPayload = {
    label: `${quote.title} approved defaults`,
    documentMode: inferDocumentMode(quote.title, data),
    paymentTerms,
    exclusions,
    specialConditions: normalizeList(data.specialConditions),
    notes: normalizeList(data.notes),
    sourceType: "quote" as const,
    sourceQuoteId: quote.id,
    approvedAt: now,
    updatedAt: now,
  };

  if (existingDefault) {
    await db
      .update(commercialDefaults)
      .set(commercialPayload)
      .where(eq(commercialDefaults.id, existingDefault.id));
    return;
  }

  await db.insert(commercialDefaults).values({
    id: newId(),
    scope: "customer",
    customerAccountId: account.id,
    companyProfileId: null,
    createdAt: now,
    ...commercialPayload,
  });
}
