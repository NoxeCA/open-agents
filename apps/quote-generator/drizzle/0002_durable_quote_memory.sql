CREATE TABLE "company_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"company_name" text NOT NULL,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"normalized_name" text NOT NULL,
	"display_name" text NOT NULL,
	"legal_name" text,
	"preferred_lang" text,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"billing_address" text,
	"site_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_quote_id" text,
	"last_confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_account_id" text NOT NULL,
	"normalized_name" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"company" text,
	"email" text,
	"phone" text,
	"address" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"source_quote_id" text,
	"last_confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commercial_defaults" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"company_profile_id" text,
	"customer_account_id" text,
	"label" text NOT NULL,
	"document_mode" text,
	"payment_terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"special_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_type" text DEFAULT 'quote' NOT NULL,
	"source_quote_id" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_accounts" ADD CONSTRAINT "customer_accounts_source_quote_id_quotes_id_fk" FOREIGN KEY ("source_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_source_quote_id_quotes_id_fk" FOREIGN KEY ("source_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "commercial_defaults" ADD CONSTRAINT "commercial_defaults_company_profile_id_company_profiles_id_fk" FOREIGN KEY ("company_profile_id") REFERENCES "public"."company_profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "commercial_defaults" ADD CONSTRAINT "commercial_defaults_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "commercial_defaults" ADD CONSTRAINT "commercial_defaults_source_quote_id_quotes_id_fk" FOREIGN KEY ("source_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "company_profiles_slug_idx" ON "company_profiles" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_accounts_normalized_name_idx" ON "customer_accounts" USING btree ("normalized_name");
--> statement-breakpoint
CREATE INDEX "customer_contacts_account_id_idx" ON "customer_contacts" USING btree ("customer_account_id");
--> statement-breakpoint
CREATE INDEX "customer_contacts_account_name_idx" ON "customer_contacts" USING btree ("customer_account_id","normalized_name");
--> statement-breakpoint
CREATE INDEX "commercial_defaults_scope_idx" ON "commercial_defaults" USING btree ("scope");
--> statement-breakpoint
CREATE INDEX "commercial_defaults_company_profile_idx" ON "commercial_defaults" USING btree ("company_profile_id");
--> statement-breakpoint
CREATE INDEX "commercial_defaults_customer_account_idx" ON "commercial_defaults" USING btree ("customer_account_id");
