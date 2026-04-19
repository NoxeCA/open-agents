import { attachedDocumentSchema } from "@/lib/documents/quote/shared/schemas";
import {
  createEmptyQuoteDocumentContent,
  normalizeQuoteDocumentContent,
} from "@/lib/quote/schema/document-content";
import { z } from "zod";

import { brandConfigOverrideSchema } from "./brand/schema";

export const QUOTE_JSON_RENDER_STATE_VERSION = 1 as const;

const quoteJsonRenderAttachmentsSchema = z
  .array(attachedDocumentSchema)
  .optional();

export const quoteJsonRenderSpecSchema = z.object({
  version: z.literal(1),
  brand: brandConfigOverrideSchema.optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  attachments: quoteJsonRenderAttachmentsSchema,
  document: z.object({
    type: z.literal("Document"),
    lang: z.enum(["fr", "en"]).default("fr"),
    children: z.array(z.unknown()).min(1),
  }),
});

export const quoteJsonRenderStateSchema = z
  .object({
    version: z
      .literal(QUOTE_JSON_RENDER_STATE_VERSION)
      .default(QUOTE_JSON_RENDER_STATE_VERSION),
    spec: quoteJsonRenderSpecSchema,
  })
  .passthrough();

export type QuoteJsonRenderSpec = z.infer<typeof quoteJsonRenderSpecSchema>;
export type QuoteJsonRenderState = z.infer<typeof quoteJsonRenderStateSchema>;
export type QuoteJsonRenderSeedInput = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneRecord(value: Record<string, unknown>) {
  try {
    return structuredClone(value) as Record<string, unknown>;
  } catch {
    return { ...value };
  }
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function readPositiveInteger(value: unknown, fallback = 1) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : fallback;
}

function readLang(value: unknown): "fr" | "en" {
  return typeof value === "string" && value.toLowerCase().startsWith("en")
    ? "en"
    : "fr";
}

function mergeRecords(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>,
) {
  const output: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    const existing = output[key];

    if (isRecord(existing) && isRecord(value)) {
      output[key] = mergeRecords(existing, value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

function getDefaultDocumentType(lang: "fr" | "en") {
  return lang === "fr" ? "PROPOSITION" : "PROPOSAL";
}

function getDefaultDocumentTitle(lang: "fr" | "en") {
  return lang === "fr" ? "Proposition sans titre" : "Untitled proposal";
}

function getDefaultProjectIntro(lang: "fr" | "en") {
  return lang === "fr"
    ? "Cette proposition est prete pour la composition PDF."
    : "This proposal is ready for PDF composition.";
}

function getDefaultSubtitle(lang: "fr" | "en") {
  return lang === "fr" ? "Document de travail" : "Working document";
}

function buildQuoteVariableSnapshot(seed: QuoteJsonRenderSeedInput) {
  const quote = cloneRecord(seed);
  delete quote.jsonRender;
  delete quote.document;

  const lang = readLang(quote.lang);
  const projectSummary = readRecord(quote.projectSummary);

  quote.lang = lang;
  quote.documentType = readString(
    quote.documentType,
    getDefaultDocumentType(lang),
  );
  quote.documentTitle =
    readString(quote.documentTitle) ||
    readString(quote.projectTitle) ||
    getDefaultDocumentTitle(lang);
  quote.projectIntro =
    readString(quote.projectIntro) ||
    readString(projectSummary?.description) ||
    getDefaultProjectIntro(lang);
  quote.subtitle = readString(quote.subtitle, getDefaultSubtitle(lang));
  quote.quoteID = readString(quote.quoteID, "DRAFT");
  quote.revision = readPositiveInteger(quote.revision, 1);
  quote.preparedFor = Array.isArray(quote.preparedFor) ? quote.preparedFor : [];
  quote.preparedBy = Array.isArray(quote.preparedBy) ? quote.preparedBy : [];

  return quote;
}

function buildLegacyDocumentSnapshot(document: unknown) {
  const record = readRecord(document);
  if (!record) {
    return undefined;
  }

  const snapshot = cloneRecord(record);
  delete snapshot.spec;

  return snapshot;
}

function buildQuoteJsonRenderVariables(seed: QuoteJsonRenderSeedInput) {
  const composition =
    readRecord(seed.composition) ?? readRecord(seed.documentPlan) ?? undefined;
  const legacyDocument = buildLegacyDocumentSnapshot(seed.document);

  const variables: Record<string, unknown> = {
    quote: buildQuoteVariableSnapshot(seed),
    documentContent:
      seed.documentContent !== undefined
        ? normalizeQuoteDocumentContent(seed.documentContent)
        : createEmptyQuoteDocumentContent(),
  };

  if (composition) {
    variables.composition = composition;
  }

  if (legacyDocument) {
    variables.legacyDocument = legacyDocument;
  }

  return variables;
}

function buildDefaultDocumentChildren() {
  return [
    {
      type: "Page",
      header: false,
      footer: "none",
      children: [
        {
          type: "Label",
          text: {
            $state: "quote.documentType",
          },
          uppercase: true,
        },
        {
          type: "Heading",
          text: {
            $state: "quote.documentTitle",
          },
          level: 1,
        },
        {
          type: "Paragraph",
          text: {
            $state: "quote.projectIntro",
          },
          muted: true,
        },
      ],
    },
  ];
}

function buildQuoteJsonRenderSpec(seed: QuoteJsonRenderSeedInput = {}) {
  const lang = readLang(seed.lang);
  const attachments = quoteJsonRenderAttachmentsSchema.safeParse(
    seed.attachedDocuments,
  );
  const variables = buildQuoteJsonRenderVariables(seed);

  return {
    version: 1 as const,
    ...(attachments.success && attachments.data
      ? { attachments: attachments.data }
      : {}),
    variables,
    document: {
      type: "Document" as const,
      lang,
      children: buildDefaultDocumentChildren(),
    },
  } satisfies QuoteJsonRenderSpec;
}

function extractRawSpec(value: unknown) {
  const record = readRecord(value);
  return record?.spec ?? value;
}

function hasExplicitDocumentLang(value: unknown) {
  const record = readRecord(value);
  const document = readRecord(record?.document);
  return document?.lang === "fr" || document?.lang === "en";
}

function syncQuoteJsonRenderSpec(
  spec: QuoteJsonRenderSpec,
  seed: QuoteJsonRenderSeedInput,
  options?: {
    hasExplicitDocumentLang?: boolean;
  },
) {
  const base = buildQuoteJsonRenderSpec(seed);
  const mergedVariables = mergeRecords(
    readRecord(base.variables) ?? {},
    readRecord(spec.variables) ?? {},
  );

  return {
    ...spec,
    version: 1 as const,
    attachments: spec.attachments ?? base.attachments,
    variables: mergedVariables,
    document: {
      ...spec.document,
      lang: options?.hasExplicitDocumentLang
        ? spec.document.lang
        : base.document.lang,
      children:
        spec.document.children.length > 0
          ? spec.document.children
          : base.document.children,
    },
  } satisfies QuoteJsonRenderSpec;
}

export function buildQuoteJsonRenderState(
  seed: QuoteJsonRenderSeedInput = {},
): QuoteJsonRenderState {
  return {
    version: QUOTE_JSON_RENDER_STATE_VERSION,
    spec: buildQuoteJsonRenderSpec(seed),
  };
}

export function normalizeQuoteJsonRenderState(
  value: unknown,
  seed: QuoteJsonRenderSeedInput = {},
): QuoteJsonRenderState {
  const rawSpec = extractRawSpec(value);
  const hasStateLang = hasExplicitDocumentLang(rawSpec);
  const parsedState = quoteJsonRenderStateSchema.safeParse(value);

  if (parsedState.success) {
    return {
      ...parsedState.data,
      version: QUOTE_JSON_RENDER_STATE_VERSION,
      spec: syncQuoteJsonRenderSpec(parsedState.data.spec, seed, {
        hasExplicitDocumentLang: hasStateLang,
      }),
    };
  }

  const parsedSpec = quoteJsonRenderSpecSchema.safeParse(rawSpec);
  if (parsedSpec.success) {
    return {
      version: QUOTE_JSON_RENDER_STATE_VERSION,
      spec: syncQuoteJsonRenderSpec(parsedSpec.data, seed, {
        hasExplicitDocumentLang: hasStateLang,
      }),
    };
  }

  return buildQuoteJsonRenderState(seed);
}
