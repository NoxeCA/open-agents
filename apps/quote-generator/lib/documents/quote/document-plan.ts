import { z } from "zod";

export const QUOTE_DOCUMENT_SECTION_KEYS = [
  "cover",
  "table-of-contents",
  "about-us",
  "culture",
  "ceo-message",
  "team",
  "partners",
  "proposal-description",
  "service-sections",
  "project-summary",
  "optional-pages",
  "exclusions-conditions",
  "terms-and-conditions",
] as const;

export const QUOTE_DOCUMENT_SECTION_VARIANTS = [
  "small",
  "standard",
  "detailed",
] as const;

export const QUOTE_DOCUMENT_SERVICE_LAYOUTS = [
  "zero-ventilation",
  "itemized-without-price",
  "itemized-with-price",
] as const;

export const QUOTE_DOCUMENT_CATALOG_VERSION = 1 as const;

export const quoteDocumentSectionKeySchema = z.enum(
  QUOTE_DOCUMENT_SECTION_KEYS,
);
export const quoteDocumentSectionVariantSchema = z.enum(
  QUOTE_DOCUMENT_SECTION_VARIANTS,
);
export const quoteDocumentServiceLayoutSchema = z.enum(
  QUOTE_DOCUMENT_SERVICE_LAYOUTS,
);

export type QuoteDocumentSectionKey = z.infer<
  typeof quoteDocumentSectionKeySchema
>;
export type QuoteDocumentSectionVariant = z.infer<
  typeof quoteDocumentSectionVariantSchema
>;
export type QuoteDocumentServiceLayout = z.infer<
  typeof quoteDocumentServiceLayoutSchema
>;

export const QUOTE_DOCUMENT_DEFAULT_ENABLED_SECTIONS = [
  "cover",
  "table-of-contents",
  "proposal-description",
  "service-sections",
  "project-summary",
  "exclusions-conditions",
  "terms-and-conditions",
] as const satisfies readonly QuoteDocumentSectionKey[];

const quoteDocumentDefaultEnabledSectionSet = new Set<QuoteDocumentSectionKey>(
  QUOTE_DOCUMENT_DEFAULT_ENABLED_SECTIONS,
);

function defaultSectionOrder(key: QuoteDocumentSectionKey) {
  return QUOTE_DOCUMENT_SECTION_KEYS.indexOf(key) + 1;
}

function isDefaultEnabled(key: QuoteDocumentSectionKey) {
  return quoteDocumentDefaultEnabledSectionSet.has(key);
}

export const quoteDocumentSectionSelectionSchema = z.object({
  key: quoteDocumentSectionKeySchema,
  enabled: z.boolean(),
  order: z.number().int().positive(),
  variant: quoteDocumentSectionVariantSchema.nullable().optional(),
});

export type QuoteDocumentSectionSelection = z.infer<
  typeof quoteDocumentSectionSelectionSchema
>;

export const quoteDocumentPlanSchema = z
  .object({
    catalogVersion: z.literal(QUOTE_DOCUMENT_CATALOG_VERSION).default(
      QUOTE_DOCUMENT_CATALOG_VERSION,
    ),
    sections: z
      .array(quoteDocumentSectionSelectionSchema)
      .min(1)
      .superRefine((sections, ctx) => {
        const seenKeys = new Set<QuoteDocumentSectionKey>();
        const seenOrders = new Set<number>();

        for (const [index, section] of sections.entries()) {
          if (seenKeys.has(section.key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "key"],
              message: `Duplicate section key: ${section.key}`,
            });
          }
          seenKeys.add(section.key);

          if (seenOrders.has(section.order)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "order"],
              message: `Duplicate section order: ${section.order}`,
            });
          }
          seenOrders.add(section.order);
        }
      }),
    serviceLayout: quoteDocumentServiceLayoutSchema.optional(),
  })
  .transform((plan) => ({
    ...plan,
    sections: [...plan.sections].sort((left, right) => left.order - right.order),
  }));

export type QuoteDocumentPlan = z.infer<typeof quoteDocumentPlanSchema>;

export function createDefaultQuoteDocumentPlan(
  options: {
    serviceLayout?: QuoteDocumentServiceLayout;
    sectionVariants?: Partial<
      Record<QuoteDocumentSectionKey, QuoteDocumentSectionVariant | null>
    >;
  } = {},
): QuoteDocumentPlan {
  const sections = QUOTE_DOCUMENT_SECTION_KEYS.map((key) => ({
    key,
    enabled: isDefaultEnabled(key),
    order: defaultSectionOrder(key),
    variant: options.sectionVariants?.[key] ?? null,
  }));

  return quoteDocumentPlanSchema.parse({
    catalogVersion: QUOTE_DOCUMENT_CATALOG_VERSION,
    sections,
    serviceLayout: options.serviceLayout,
  });
}

export function getQuoteDocumentSectionSelection(
  plan: QuoteDocumentPlan,
  key: QuoteDocumentSectionKey,
) {
  return plan.sections.find((section) => section.key === key);
}

export function isQuoteDocumentSectionEnabled(
  plan: QuoteDocumentPlan,
  key: QuoteDocumentSectionKey,
) {
  return getQuoteDocumentSectionSelection(plan, key)?.enabled ?? false;
}
