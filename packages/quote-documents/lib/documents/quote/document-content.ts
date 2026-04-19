import { z } from "zod";

import { quoteRichContentBlockSchema } from "./rich-content";

export const QUOTE_DOCUMENT_CONTENT_VERSION = 1 as const;
export const QUOTE_DOCUMENT_REGION_ID_PATTERN =
  "^[a-z0-9-]+(?::[a-z0-9-]+)+$";
export const QUOTE_DOCUMENT_REGION_TARGETS = [
  "proposal",
  "service",
  "optional",
  "summary",
  "commercial",
  "terms",
  "about-us",
  "culture",
  "team",
  "partners",
] as const;

export const quoteDocumentRegionScopeSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const quoteDocumentRegionIdSchema = z
  .string()
  .regex(new RegExp(QUOTE_DOCUMENT_REGION_ID_PATTERN));

export const quoteDocumentRegionTargetSchema = z.object({
  scope: quoteDocumentRegionScopeSchema,
  index: z.number().int().nonnegative().optional(),
  anchor: quoteDocumentRegionScopeSchema,
});

export const quoteDocumentContentRegionSchema = z.object({
  target: quoteDocumentRegionTargetSchema,
  label: z.string().min(1).optional(),
  locationHints: z.array(z.string().min(1)).default([]),
  blocks: z.array(quoteRichContentBlockSchema).default([]),
});

export const quoteDocumentRegionSchema = quoteDocumentContentRegionSchema;

export const quoteDocumentRegionsSchema = z.record(
  quoteDocumentRegionIdSchema,
  quoteDocumentContentRegionSchema,
);

export const quoteDocumentContentSchema = z.object({
  version: z
    .literal(QUOTE_DOCUMENT_CONTENT_VERSION)
    .default(QUOTE_DOCUMENT_CONTENT_VERSION),
  regions: quoteDocumentRegionsSchema.default({}),
});

export type QuoteDocumentRegionId = z.infer<typeof quoteDocumentRegionIdSchema>;
export type QuoteDocumentRegionScope = z.infer<
  typeof quoteDocumentRegionScopeSchema
>;
export type QuoteDocumentRegionTarget = z.infer<
  typeof quoteDocumentRegionTargetSchema
>;
export type QuoteDocumentRegion = z.infer<typeof quoteDocumentRegionSchema>;
export type QuoteDocumentContentRegion = QuoteDocumentRegion;
export type QuoteDocumentRegions = z.infer<typeof quoteDocumentRegionsSchema>;
export type QuoteDocumentContent = z.infer<typeof quoteDocumentContentSchema>;

export type QuoteDocumentContentSeedInput = {
  proposal?: {
    blocks?: unknown;
  };
  services?: Array<{
    sectionNumber?: unknown;
    sectionName?: unknown;
    layout?: unknown;
    bomItems?: unknown;
    laborCategories?: unknown;
    overviewBlocks?: unknown;
    tableIntroBlocks?: unknown;
    tableOutroBlocks?: unknown;
    footerBlocks?: unknown;
  }>;
  optionalPages?: Array<{
    blocks?: unknown;
  }>;
  documentContent?: unknown;
};

type QuoteDocumentContentServiceSeed = NonNullable<
  QuoteDocumentContentSeedInput["services"]
>[number];
type QuoteDocumentContentOptionalPageSeed = NonNullable<
  QuoteDocumentContentSeedInput["optionalPages"]
>[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildLabel(target: QuoteDocumentRegionTarget) {
  const anchorLabel = target.anchor.replace(/-/g, " ");

  if (typeof target.index === "number") {
    return `${target.scope} ${target.index + 1} ${anchorLabel}`;
  }

  return `${target.scope} ${anchorLabel}`;
}

export function slugifyQuoteDocumentRegionToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseBlocks(value: unknown) {
  const parsed = z.array(quoteRichContentBlockSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function buildQuoteDocumentRegionId(target: QuoteDocumentRegionTarget) {
  const scope = slugifyQuoteDocumentRegionToken(target.scope);
  const anchor = slugifyQuoteDocumentRegionToken(target.anchor);

  return typeof target.index === "number"
    ? `${scope}:${target.index}:${anchor}`
    : `${scope}:${anchor}`;
}

export function buildQuoteDocumentOptionalPageRegionTarget(
  _page: QuoteDocumentContentOptionalPageSeed,
  index: number,
  anchor: string,
): QuoteDocumentRegionTarget {
  return {
    scope: "optional",
    index,
    anchor,
  };
}

export function parseQuoteDocumentRegionId(
  regionId: string,
): QuoteDocumentRegionTarget | null {
  const parsed = quoteDocumentRegionIdSchema.safeParse(regionId);
  if (!parsed.success) {
    return null;
  }

  const segments = regionId.split(":");
  if (segments.length < 2) {
    return null;
  }

  if (segments.length >= 3 && /^\d+$/.test(segments[1] ?? "")) {
    const [scope, rawIndex, ...anchorParts] = segments;
    const target = {
      scope,
      index: Number(rawIndex),
      anchor: anchorParts.join(":"),
    };

    return quoteDocumentRegionTargetSchema.safeParse(target).success
      ? target
      : null;
  }

  const [scope, ...anchorParts] = segments;
  const target = {
    scope,
    anchor: anchorParts.join(":"),
  };

  return quoteDocumentRegionTargetSchema.safeParse(target).success
    ? target
    : null;
}

export function createQuoteDocumentRegion(
  target: QuoteDocumentRegionTarget,
  options?: {
    blocks?: unknown;
    label?: string;
    locationHints?: string[];
  },
): QuoteDocumentRegion {
  return {
    target,
    label: options?.label ?? buildLabel(target),
    locationHints: options?.locationHints ?? [],
    blocks: parseBlocks(options?.blocks),
  };
}

function ensureRegion(
  regions: QuoteDocumentRegions,
  target: QuoteDocumentRegionTarget,
  options?: {
    blocks?: unknown;
    label?: string;
    locationHints?: string[];
  },
) {
  const regionId = buildQuoteDocumentRegionId(target);
  if (regions[regionId]) {
    return;
  }

  regions[regionId] = createQuoteDocumentRegion(target, options);
}

function seedServiceRegions(
  regions: QuoteDocumentRegions,
  service: QuoteDocumentContentServiceSeed,
  index: number,
) {
  ensureRegion(
    regions,
    { scope: "service", index, anchor: "overview" },
    {
      blocks: service?.overviewBlocks,
      locationHints: ["before pricing", "overview"],
    },
  );
  ensureRegion(regions, {
    scope: "service",
    index,
    anchor: "after-description",
  });

  const hasBom =
    Array.isArray(service?.bomItems) && service.bomItems.length > 0;
  const hasOtherCosts =
    Array.isArray(service?.laborCategories) &&
    service.laborCategories.length > 0;

  if (hasBom || hasOtherCosts) {
    ensureRegion(
      regions,
      { scope: "service", index, anchor: "before-table" },
      { blocks: service?.tableIntroBlocks, locationHints: ["above table"] },
    );
    ensureRegion(
      regions,
      { scope: "service", index, anchor: "after-table" },
      { blocks: service?.tableOutroBlocks, locationHints: ["below table"] },
    );
  }

  ensureRegion(regions, {
    scope: "service",
    index,
    anchor: "after-total",
  });
  ensureRegion(
    regions,
    { scope: "service", index, anchor: "after-tax" },
    { blocks: service?.footerBlocks, locationHints: ["below tax disclaimer"] },
  );
}

function seedOptionalPageRegions(
  regions: QuoteDocumentRegions,
  page: QuoteDocumentContentOptionalPageSeed,
  index: number,
) {
  ensureRegion(regions, {
    scope: "optional",
    index,
    anchor: "after-title",
  });
  ensureRegion(
    regions,
    { scope: "optional", index, anchor: "body" },
    { blocks: page?.blocks, locationHints: ["optional page body"] },
  );
  ensureRegion(regions, {
    scope: "optional",
    index,
    anchor: "footer",
  });
}

function seedSummaryRegions(regions: QuoteDocumentRegions) {
  ensureRegion(regions, {
    scope: "summary",
    anchor: "before-table",
  });
  ensureRegion(regions, {
    scope: "summary",
    anchor: "after-table",
  });
  ensureRegion(regions, {
    scope: "summary",
    anchor: "after-total",
  });
  ensureRegion(regions, {
    scope: "summary",
    anchor: "after-tax",
  });
}

function seedCommercialRegions(regions: QuoteDocumentRegions) {
  ensureRegion(regions, {
    scope: "commercial",
    anchor: "after-exclusions",
  });
  ensureRegion(regions, {
    scope: "commercial",
    anchor: "after-special-conditions",
  });
  ensureRegion(regions, {
    scope: "commercial",
    anchor: "after-notes",
  });
  ensureRegion(regions, {
    scope: "commercial",
    anchor: "after-payment-terms",
  });
  ensureRegion(regions, {
    scope: "commercial",
    anchor: "after-info",
  });
}

function seedTermsRegions(regions: QuoteDocumentRegions) {
  ensureRegion(regions, {
    scope: "terms",
    anchor: "before-sections",
  });
  ensureRegion(regions, {
    scope: "terms",
    anchor: "after-sections",
  });
}

function seedStoryRegions(regions: QuoteDocumentRegions) {
  for (const scope of ["about-us", "culture", "team", "partners"] as const) {
    ensureRegion(regions, {
      scope,
      anchor: "after-intro",
    });
    ensureRegion(regions, {
      scope,
      anchor: "body",
    });
    ensureRegion(regions, {
      scope,
      anchor: "footer",
    });
  }
}

export function buildQuoteDocumentContent(
  input: QuoteDocumentContentSeedInput,
): QuoteDocumentContent {
  const documentContentRecord = isRecord(input.documentContent)
    ? input.documentContent
    : null;
  const existingContent = documentContentRecord
    ? quoteDocumentContentSchema.safeParse(documentContentRecord)
    : null;
  const existingRegions =
    documentContentRecord && isRecord(documentContentRecord.regions)
      ? quoteDocumentRegionsSchema.safeParse(documentContentRecord.regions)
      : null;

  const regions: QuoteDocumentRegions = existingRegions?.success
    ? { ...existingRegions.data }
    : {};

  ensureRegion(
    regions,
    { scope: "proposal", anchor: "body" },
    { blocks: input.proposal?.blocks, locationHints: ["proposal body"] },
  );
  ensureRegion(regions, {
    scope: "proposal",
    anchor: "after-object",
  });
  ensureRegion(regions, {
    scope: "proposal",
    anchor: "after-paragraphs",
  });
  ensureRegion(regions, {
    scope: "proposal",
    anchor: "footer",
  });

  for (const [index, service] of (input.services ?? []).entries()) {
    seedServiceRegions(regions, service, index);
  }

  for (const [index, page] of (input.optionalPages ?? []).entries()) {
    seedOptionalPageRegions(regions, page, index);
  }

  seedSummaryRegions(regions);
  seedCommercialRegions(regions);
  seedTermsRegions(regions);
  seedStoryRegions(regions);

  return {
    version: existingContent?.success
      ? existingContent.data.version
      : QUOTE_DOCUMENT_CONTENT_VERSION,
    regions,
  };
}

export function normalizeQuoteDocumentContent(
  input: QuoteDocumentContentSeedInput | QuoteDocumentContent | unknown,
) {
  const parsed = quoteDocumentContentSchema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  if (isRecord(input)) {
    return buildQuoteDocumentContent(input as QuoteDocumentContentSeedInput);
  }

  return createEmptyQuoteDocumentContent();
}

export function createEmptyQuoteDocumentContent() {
  return buildQuoteDocumentContent({});
}
