import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { quotes } from "./quotes";

export const companyProfiles = pgTable(
  "company_profiles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    companyName: text("company_name").notNull(),
    profile: jsonb("profile").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("company_profiles_slug_idx").on(t.slug)],
);

export const customerAccounts = pgTable(
  "customer_accounts",
  {
    id: text("id").primaryKey(),
    normalizedName: text("normalized_name").notNull(),
    displayName: text("display_name").notNull(),
    legalName: text("legal_name"),
    preferredLang: text("preferred_lang", { enum: ["fr", "en"] }),
    aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
    billingAddress: text("billing_address"),
    siteAddresses: jsonb("site_addresses").$type<string[]>().notNull().default([]),
    sourceQuoteId: text("source_quote_id").references(() => quotes.id, {
      onDelete: "set null",
    }),
    lastConfirmedAt: timestamp("last_confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("customer_accounts_normalized_name_idx").on(t.normalizedName),
  ],
);

export const customerContacts = pgTable(
  "customer_contacts",
  {
    id: text("id").primaryKey(),
    customerAccountId: text("customer_account_id")
      .notNull()
      .references(() => customerAccounts.id, { onDelete: "cascade" }),
    normalizedName: text("normalized_name").notNull(),
    name: text("name").notNull(),
    title: text("title"),
    company: text("company"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    isPrimary: boolean("is_primary").notNull().default(false),
    sourceQuoteId: text("source_quote_id").references(() => quotes.id, {
      onDelete: "set null",
    }),
    lastConfirmedAt: timestamp("last_confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("customer_contacts_account_id_idx").on(t.customerAccountId),
    index("customer_contacts_account_name_idx").on(
      t.customerAccountId,
      t.normalizedName,
    ),
  ],
);

export const commercialDefaults = pgTable(
  "commercial_defaults",
  {
    id: text("id").primaryKey(),
    scope: text("scope", { enum: ["company", "customer"] }).notNull(),
    companyProfileId: text("company_profile_id").references(
      () => companyProfiles.id,
      { onDelete: "cascade" },
    ),
    customerAccountId: text("customer_account_id").references(
      () => customerAccounts.id,
      { onDelete: "cascade" },
    ),
    label: text("label").notNull(),
    documentMode: text("document_mode", {
      enum: ["project-proposal", "service-agreement"],
    }),
    paymentTerms: jsonb("payment_terms").$type<string[]>().notNull().default([]),
    exclusions: jsonb("exclusions").$type<string[]>().notNull().default([]),
    specialConditions: jsonb("special_conditions")
      .$type<string[]>()
      .notNull()
      .default([]),
    notes: jsonb("notes").$type<string[]>().notNull().default([]),
    sourceType: text("source_type", { enum: ["seed", "quote"] })
      .notNull()
      .default("quote"),
    sourceQuoteId: text("source_quote_id").references(() => quotes.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("commercial_defaults_scope_idx").on(t.scope),
    index("commercial_defaults_company_profile_idx").on(t.companyProfileId),
    index("commercial_defaults_customer_account_idx").on(t.customerAccountId),
  ],
);

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type CustomerAccount = typeof customerAccounts.$inferSelect;
export type CustomerContact = typeof customerContacts.$inferSelect;
export type CommercialDefault = typeof commercialDefaults.$inferSelect;
