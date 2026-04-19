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
import {
  buildCommercialDocumentContentRegionId,
  buildDocumentContentBlocksPath,
  buildOptionalPageDocumentContentRegionId,
  buildProposalDocumentContentRegionId,
  buildServiceDocumentContentRegionId,
  buildSummaryDocumentContentRegionId,
  buildTermsDocumentContentRegionId,
} from "./document-content-regions";

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
    rendererMap: Array<{
      pageStart: number;
      pageEnd: number;
      title: string;
      kind:
        | "cover"
        | "table-of-contents"
        | "story"
        | "proposal"
        | "service-overview"
        | "service-pricing"
        | "service-costs"
        | "project-summary"
        | "optional-page"
        | "commercial"
        | "terms";
      editTargets: string[];
      editableRegions: Array<{
        regionId: string;
        patchPaths: string[];
        locationHints: string[];
        supportedBlocks: string[];
        notes: string[];
      }>;
      notes: string[];
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
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
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
    .replace(/[\u0300-\u036F]/g, "")
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

function readContactInfo(
  root: Record<string, unknown> | null,
): ContactMemory | null {
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
            [
              person.name,
              "company" in person ? asString(person.company) : undefined,
            ]
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

const quoteRichBlockTypes = [
  "heading",
  "paragraph",
  "quote",
  "list",
  "table",
  "image",
  "stats",
  "divider",
  "spacer",
] as const;

export function buildRendererMap(data: Partial<QuoteData>) {
  const entries: QuoteAgentPromptContext["quoteState"]["rendererMap"] = [];
  let page = 1;

  const pushEntry = (
    entry: QuoteAgentPromptContext["quoteState"]["rendererMap"][number],
  ) => {
    entries.push(entry);
    page = entry.pageEnd + 1;
  };

  pushEntry({
    pageStart: page,
    pageEnd: page,
    title: "Cover",
    kind: "cover",
    editTargets: ["/projectTitle", "/preparedBy", "/preparedFor"],
    editableRegions: [
      {
        regionId: "cover_identity",
        patchPaths: ["/projectTitle", "/preparedBy", "/preparedFor"],
        locationHints: [
          "cover",
          "first page",
          "title block",
          "prepared by",
          "prepared for",
        ],
        supportedBlocks: [],
        notes: ["Patch the exact cover identity fields instead of /notes."],
      },
    ],
    notes: ["Cover content only. Do not use /notes for cover copy."],
  });

  pushEntry({
    pageStart: page,
    pageEnd: page,
    title: "Table of contents",
    kind: "table-of-contents",
    editTargets: [],
    editableRegions: [],
    notes: ["Generated from the document structure."],
  });

  if (data.includeAboutUs !== false) {
    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: "About Us",
      kind: "story",
      editTargets: ["/includeAboutUs"],
      editableRegions: [
        {
          regionId: "about-us:after-intro",
          patchPaths: ["/documentContent/regions/about-us:after-intro/blocks"],
          locationHints: ["about us page", "company page", "after intro"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "divider", "spacer"],
          notes: ["Use this region for inserted content after the About Us intro."],
        },
        {
          regionId: "about-us:body",
          patchPaths: ["/documentContent/regions/about-us:body/blocks"],
          locationHints: ["about us body", "middle of about us page"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "table", "stats", "divider", "spacer"],
          notes: ["Use this region for additional narrative or structured content in the body of the About Us page."],
        },
        {
          regionId: "about-us:footer",
          patchPaths: ["/documentContent/regions/about-us:footer/blocks"],
          locationHints: ["about us footer", "bottom of about us page"],
          supportedBlocks: ["paragraph", "quote", "list", "divider", "spacer"],
          notes: ["Use this region for closing content at the bottom of the About Us page."],
        },
        {
          regionId: "about_us_visibility",
          patchPaths: ["/includeAboutUs"],
          locationHints: ["about us page", "company page", "remove this page"],
          supportedBlocks: [],
          notes: [
            "Use the visibility toggle only when the user wants to add or remove the whole page.",
          ],
        },
      ],
      notes: ["Brochure page with editable rich-content regions plus a visibility toggle."],
    });
  }

  if (data.includeCulture !== false) {
    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: "Culture",
      kind: "story",
      editTargets: ["/includeCulture"],
      editableRegions: [
        {
          regionId: "culture:after-intro",
          patchPaths: ["/documentContent/regions/culture:after-intro/blocks"],
          locationHints: ["culture page", "after intro"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "divider", "spacer"],
          notes: ["Use this region for inserted content after the Culture page title."],
        },
        {
          regionId: "culture:body",
          patchPaths: ["/documentContent/regions/culture:body/blocks"],
          locationHints: ["culture body", "middle of culture page"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "table", "stats", "divider", "spacer"],
          notes: ["Use this region for additional narrative or structured content inside the Culture page."],
        },
        {
          regionId: "culture:footer",
          patchPaths: ["/documentContent/regions/culture:footer/blocks"],
          locationHints: ["culture footer", "bottom of culture page"],
          supportedBlocks: ["paragraph", "quote", "list", "divider", "spacer"],
          notes: ["Use this region for closing content at the bottom of the Culture page."],
        },
        {
          regionId: "culture_visibility",
          patchPaths: ["/includeCulture"],
          locationHints: ["culture page", "remove this page"],
          supportedBlocks: [],
          notes: [
            "Use the visibility toggle only when the user wants to add or remove the whole page.",
          ],
        },
      ],
      notes: ["Brochure page with editable rich-content regions plus a visibility toggle."],
    });
  }

  if (data.includeCeoMessage !== false && data.ceo) {
    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: "Leadership note",
      kind: "story",
      editTargets: ["/includeCeoMessage", "/ceo"],
      editableRegions: [
        {
          regionId: "leadership_content",
          patchPaths: ["/ceo"],
          locationHints: [
            "leadership page",
            "ceo note",
            "message from leadership",
          ],
          supportedBlocks: [],
          notes: [
            "Leadership copy belongs under /ceo and related story fields.",
          ],
        },
        {
          regionId: "leadership_visibility",
          patchPaths: ["/includeCeoMessage"],
          locationHints: ["remove leadership page", "hide ceo note"],
          supportedBlocks: [],
          notes: [
            "Use the visibility toggle only when the user wants to add or remove the whole page.",
          ],
        },
      ],
      notes: [
        "Leadership page content belongs under /ceo and related story fields.",
      ],
    });
  }

  if (data.includeTeam !== false && data.team) {
    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: "Team",
      kind: "story",
      editTargets: ["/includeTeam", "/team"],
      editableRegions: [
        {
          regionId: "team:after-intro",
          patchPaths: ["/documentContent/regions/team:after-intro/blocks"],
          locationHints: ["team page", "after intro"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "divider", "spacer"],
          notes: ["Use this region for inserted content after the Team page intro."],
        },
        {
          regionId: "team:body",
          patchPaths: ["/documentContent/regions/team:body/blocks"],
          locationHints: ["team body", "below team cards", "our team"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "table", "stats", "divider", "spacer"],
          notes: ["Use this region for additional narrative or structured content around the team section."],
        },
        {
          regionId: "team:footer",
          patchPaths: ["/documentContent/regions/team:footer/blocks"],
          locationHints: ["team footer", "bottom of team page"],
          supportedBlocks: ["paragraph", "quote", "list", "divider", "spacer"],
          notes: ["Use this region for closing content at the bottom of the Team page."],
        },
        {
          regionId: "team_visibility",
          patchPaths: ["/includeTeam"],
          locationHints: ["remove team page", "hide team page"],
          supportedBlocks: [],
          notes: [
            "Use the visibility toggle only when the user wants to add or remove the whole page.",
          ],
        },
      ],
      notes: ["Team page with editable rich-content regions plus a visibility toggle."],
    });
  }

  if (data.includePartners !== false) {
    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: "Partners",
      kind: "story",
      editTargets: ["/includePartners"],
      editableRegions: [
        {
          regionId: "partners:after-intro",
          patchPaths: ["/documentContent/regions/partners:after-intro/blocks"],
          locationHints: ["partners page", "after intro"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "divider", "spacer"],
          notes: ["Use this region for inserted content after the Partners page intro."],
        },
        {
          regionId: "partners:body",
          patchPaths: ["/documentContent/regions/partners:body/blocks"],
          locationHints: ["partners body", "middle of partners page"],
          supportedBlocks: ["heading", "paragraph", "list", "quote", "table", "stats", "divider", "spacer"],
          notes: ["Use this region for additional narrative or structured content inside the Partners page."],
        },
        {
          regionId: "partners:footer",
          patchPaths: ["/documentContent/regions/partners:footer/blocks"],
          locationHints: ["partners footer", "bottom of partners page"],
          supportedBlocks: ["paragraph", "quote", "list", "divider", "spacer"],
          notes: ["Use this region for closing content at the bottom of the Partners page."],
        },
        {
          regionId: "partners_visibility",
          patchPaths: ["/includePartners"],
          locationHints: [
            "remove partners page",
            "hide partners",
          ],
          supportedBlocks: [],
          notes: ["Use the visibility toggle only when the user wants to add or remove the whole page."],
        },
      ],
      notes: ["Partners page with editable rich-content regions plus a visibility toggle."],
    });
  }

  pushEntry({
    pageStart: page,
    pageEnd: page,
    title: "Proposal description",
    kind: "proposal",
    editTargets: [
      "/proposal",
      buildDocumentContentBlocksPath(buildProposalDocumentContentRegionId()),
    ],
    editableRegions: [
      {
        regionId: buildProposalDocumentContentRegionId(),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildProposalDocumentContentRegionId(),
          ),
        ],
        locationHints: [
          "proposal page",
          "intro page",
          "proposal description",
          "before services",
          "introduction before pricing",
        ],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "The regionId itself is the stable keyed store id for this editable area.",
          "Prefer the stable keyed region path for inserted content and richer layout.",
          "If the user asks for simple prose only, a paragraph block is the default.",
        ],
      },
    ],
    notes: [
      "Use the stable keyed proposal body region for rich narrative content on the proposal page.",
    ],
  });

  for (const [index, service] of (data.services ?? []).entries()) {
    const sectionLabel =
      sanitizeText(service.sectionName) ?? `Section ${index + 1}`;
    const basePath = `/services/${index}`;
    const hasBom =
      (service.bomItems?.length ?? 0) > 0 &&
      service.layout !== "zero-ventilation";
    const hasOtherCosts = (service.laborCategories?.length ?? 0) > 0;

    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: `${sectionLabel} overview`,
      kind: "service-overview",
      editTargets: [
        `${basePath}/description`,
        buildDocumentContentBlocksPath(
          buildServiceDocumentContentRegionId(index, "overview"),
        ),
      ],
      editableRegions: [
        {
          regionId: buildServiceDocumentContentRegionId(index, "overview"),
          patchPaths: [
            buildDocumentContentBlocksPath(
              buildServiceDocumentContentRegionId(index, "overview"),
            ),
            `${basePath}/description`,
          ],
          locationHints: [
            `${sectionLabel} overview`,
            "service intro",
            "before pricing",
            "before table",
            "top of service page",
          ],
          supportedBlocks: [...quoteRichBlockTypes],
          notes: [
            "The regionId itself is the stable keyed store id for this editable area.",
            "Prefer the stable keyed overview region for inserted content.",
            "Use description only for the short built-in summary field, not for longer custom content.",
          ],
        },
      ],
      notes: [
        "Use the stable keyed overview region for narrative content before any pricing table.",
      ],
    });

    if (service.layout === "zero-ventilation") {
      pushEntry({
        pageStart: page,
        pageEnd: page,
        title: `${sectionLabel} pricing`,
        kind: "service-pricing",
        editTargets: [
          buildDocumentContentBlocksPath(
            buildServiceDocumentContentRegionId(index, "after-tax"),
          ),
        ],
        editableRegions: [
          {
            regionId: buildServiceDocumentContentRegionId(index, "after-tax"),
            patchPaths: [
              buildDocumentContentBlocksPath(
                buildServiceDocumentContentRegionId(index, "after-tax"),
              ),
            ],
            locationHints: [
              "under taxes",
              "below taxes",
              "after totals",
              "after tax disclaimer",
              "bottom of pricing page",
            ],
            supportedBlocks: [...quoteRichBlockTypes],
            notes: [
              "The regionId itself is the stable keyed store id for this editable area.",
              "This zero-ventilation pricing page places totals and the tax disclaimer on the same page.",
              "If the user asks to add text under the tax line or below the total, insert a paragraph block here.",
            ],
          },
        ],
        notes: [
          "This section renders totals and the tax disclaimer on the same pricing page.",
          "Use the stable keyed after-tax region for content that must appear below the total and tax disclaimer.",
        ],
      });
      continue;
    }

    if (hasBom) {
      pushEntry({
        pageStart: page,
        pageEnd: page,
        title: `${sectionLabel} pricing table`,
        kind: "service-pricing",
        editTargets: [
          buildDocumentContentBlocksPath(
            buildServiceDocumentContentRegionId(index, "before-table"),
          ),
          buildDocumentContentBlocksPath(
            buildServiceDocumentContentRegionId(index, "after-table"),
          ),
          ...(hasOtherCosts
            ? []
            : [
                buildDocumentContentBlocksPath(
                  buildServiceDocumentContentRegionId(index, "after-tax"),
                ),
              ]),
        ],
        editableRegions: [
          {
            regionId: buildServiceDocumentContentRegionId(index, "before-table"),
            patchPaths: [
              buildDocumentContentBlocksPath(
                buildServiceDocumentContentRegionId(index, "before-table"),
              ),
            ],
            locationHints: [
              "above table",
              "before table",
              "before pricing table",
              "intro before pricing",
            ],
            supportedBlocks: [...quoteRichBlockTypes],
            notes: [
              "The regionId itself is the stable keyed store id for this editable area.",
              "Insert rich content that must appear immediately above the pricing table.",
              "For a simple text insertion, default to a paragraph block.",
            ],
          },
          {
            regionId: buildServiceDocumentContentRegionId(index, "after-table"),
            patchPaths: [
              buildDocumentContentBlocksPath(
                buildServiceDocumentContentRegionId(index, "after-table"),
              ),
            ],
            locationHints: [
              "under table",
              "below table",
              "after table",
              "between table and totals",
            ],
            supportedBlocks: [...quoteRichBlockTypes],
            notes: [
              "The regionId itself is the stable keyed store id for this editable area.",
              "Insert rich content that must appear immediately under the pricing table and above totals.",
              "This is the right target for requests like 'add a budgetary paragraph under the table'.",
            ],
          },
          ...(!hasOtherCosts
            ? [
                {
                  regionId: buildServiceDocumentContentRegionId(index, "after-tax"),
                  patchPaths: [
                    buildDocumentContentBlocksPath(
                      buildServiceDocumentContentRegionId(index, "after-tax"),
                    ),
                  ],
                  locationHints: [
                    "under taxes",
                    "below taxes",
                    "after totals",
                    "after tax disclaimer",
                    "bottom of pricing page",
                  ],
                  supportedBlocks: [...quoteRichBlockTypes],
                  notes: [
                    "The regionId itself is the stable keyed store id for this editable area.",
                    "Use this region for content that must appear under the total and tax disclaimer on the same page.",
                  ],
                },
              ]
            : []),
        ],
        notes: [
          "Use the stable keyed before-table region above the pricing table.",
          "Use the stable keyed after-table region below the pricing table and above totals.",
          ...(hasOtherCosts
            ? [
                "Totals and tax disclaimer render on the later costs page, so the stable keyed after-tax region belongs there instead.",
              ]
            : [
                "Use the stable keyed after-tax region for content below the total and tax disclaimer on this page.",
              ]),
        ],
      });
    }

    if (hasOtherCosts) {
      pushEntry({
        pageStart: page,
        pageEnd: page,
        title: `${sectionLabel} costs and totals`,
        kind: "service-costs",
        editTargets: [
          buildDocumentContentBlocksPath(
            buildServiceDocumentContentRegionId(index, "after-tax"),
          ),
        ],
        editableRegions: [
          {
            regionId: buildServiceDocumentContentRegionId(index, "after-tax"),
            patchPaths: [
              buildDocumentContentBlocksPath(
                buildServiceDocumentContentRegionId(index, "after-tax"),
              ),
            ],
            locationHints: [
              "under taxes",
              "below taxes",
              "after totals",
              "after tax disclaimer",
              "bottom of costs page",
            ],
            supportedBlocks: [...quoteRichBlockTypes],
            notes: [
              "The regionId itself is the stable keyed store id for this editable area.",
              "This later page contains the totals and tax disclaimer.",
              "Use this region for any text that must appear after those amounts.",
            ],
          },
        ],
        notes: [
          "Use the stable keyed after-tax region for content below the total and tax disclaimer on this page.",
        ],
      });
    }

    if (!hasBom && !hasOtherCosts) {
      entries[entries.length - 1]?.notes.push(
        "This overview page also contains totals and the tax disclaimer. Use the stable keyed after-tax region below them if needed.",
      );
      entries[entries.length - 1]?.editTargets.push(
        buildDocumentContentBlocksPath(
          buildServiceDocumentContentRegionId(index, "after-tax"),
        ),
      );
      entries[entries.length - 1]?.editableRegions.push({
        regionId: buildServiceDocumentContentRegionId(index, "after-tax"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildServiceDocumentContentRegionId(index, "after-tax"),
          ),
        ],
        locationHints: [
          "under taxes",
          "below taxes",
          "after totals",
          "after tax disclaimer",
          "bottom of service page",
        ],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "The regionId itself is the stable keyed store id for this editable area.",
          "This overview page also carries totals and the tax disclaimer.",
        ],
      });
    }
  }

  pushEntry({
    pageStart: page,
    pageEnd: page,
    title: "Project summary",
    kind: "project-summary",
    editTargets: [
      "/projectSummary",
      buildDocumentContentBlocksPath(
        buildSummaryDocumentContentRegionId("before-table"),
      ),
      buildDocumentContentBlocksPath(
        buildSummaryDocumentContentRegionId("after-table"),
      ),
      buildDocumentContentBlocksPath(
        buildSummaryDocumentContentRegionId("after-total"),
      ),
      buildDocumentContentBlocksPath(
        buildSummaryDocumentContentRegionId("after-tax"),
      ),
    ],
    editableRegions: [
      {
        regionId: "project_summary_fields",
        patchPaths: ["/projectSummary"],
        locationHints: ["project summary", "final totals summary"],
        supportedBlocks: [],
        notes: [
          "Patch the structured summary fields, not /notes, when the user wants to change the project summary itself.",
        ],
      },
      {
        regionId: buildSummaryDocumentContentRegionId("before-table"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildSummaryDocumentContentRegionId("before-table"),
          ),
        ],
        locationHints: ["summary intro", "above summary table", "before totals table"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for narrative or context above the summary table.",
        ],
      },
      {
        regionId: buildSummaryDocumentContentRegionId("after-table"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildSummaryDocumentContentRegionId("after-table"),
          ),
        ],
        locationHints: ["under summary table", "after summary table", "between summary table and total"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for content under the summary table and above the total project cost.",
        ],
      },
      {
        regionId: buildSummaryDocumentContentRegionId("after-total"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildSummaryDocumentContentRegionId("after-total"),
          ),
        ],
        locationHints: ["under project total", "after total project cost"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for content under the summary total and above the tax disclaimer.",
        ],
      },
      {
        regionId: buildSummaryDocumentContentRegionId("after-tax"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildSummaryDocumentContentRegionId("after-tax"),
          ),
        ],
        locationHints: ["under summary tax line", "after summary tax disclaimer", "bottom of summary page"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for content below the summary tax disclaimer.",
        ],
      },
    ],
    notes: [
      "Project summary totals render here.",
      "Use the stable keyed summary regions for inserted content around the table, total, and tax disclaimer.",
    ],
  });

  for (const [index, optionalPage] of (data.optionalPages ?? []).entries()) {
    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: sanitizeText(optionalPage.title) ?? `Optional page ${index + 1}`,
      kind: "optional-page",
      editTargets: [
        buildDocumentContentBlocksPath(
          buildOptionalPageDocumentContentRegionId(index),
        ),
        `/optionalPages/${index}/text`,
      ],
      editableRegions: [
        {
          regionId: buildOptionalPageDocumentContentRegionId(index),
          patchPaths: [
            buildDocumentContentBlocksPath(
              buildOptionalPageDocumentContentRegionId(index),
            ),
            `/optionalPages/${index}/text`,
          ],
          locationHints: [
            "appendix page",
            "custom page",
            "freeform page",
            "page body",
          ],
          supportedBlocks: [...quoteRichBlockTypes],
          notes: [
            "The regionId itself is the stable keyed store id for this editable area.",
            "Prefer blocks for flexible composition. Use text only when the page is plain prose.",
          ],
        },
      ],
      notes: [
        "Use the stable keyed optional-page body region for freeform appendix or story pages.",
      ],
    });
  }

  pushEntry({
    pageStart: page,
    pageEnd: page,
    title: "Exclusions and conditions",
    kind: "commercial",
    editTargets: [
      "/exclusions",
      "/paymentTerms",
      "/specialConditions",
      "/notes",
    ],
    editableRegions: [
      {
        regionId: "payment_terms",
        patchPaths: ["/paymentTerms"],
        locationHints: [
          "payment terms",
          "payment schedule",
          "deposit schedule",
        ],
        supportedBlocks: [],
        notes: [
          "Structured payment term list for the commercial page near the end of the PDF.",
        ],
      },
      {
        regionId: buildCommercialDocumentContentRegionId("after-payment-terms"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildCommercialDocumentContentRegionId("after-payment-terms"),
          ),
        ],
        locationHints: ["under payment terms", "after payment schedule"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for extra content directly after the payment terms list.",
        ],
      },
      {
        regionId: "exclusions",
        patchPaths: ["/exclusions"],
        locationHints: ["exclusions", "out of scope", "scope exclusions"],
        supportedBlocks: [],
        notes: [
          "Structured exclusions list for the commercial page near the end of the PDF.",
        ],
      },
      {
        regionId: buildCommercialDocumentContentRegionId("after-exclusions"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildCommercialDocumentContentRegionId("after-exclusions"),
          ),
        ],
        locationHints: ["under exclusions", "after exclusions list"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for extra content directly after the exclusions list.",
        ],
      },
      {
        regionId: "special_conditions",
        patchPaths: ["/specialConditions"],
        locationHints: ["special conditions", "special condition note"],
        supportedBlocks: [],
        notes: [
          "Use only for meaningful commercial conditions that belong on the exclusions/conditions page.",
        ],
      },
      {
        regionId: buildCommercialDocumentContentRegionId("after-special-conditions"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildCommercialDocumentContentRegionId("after-special-conditions"),
          ),
        ],
        locationHints: ["under special conditions", "after special conditions"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for extra content directly after the special conditions list.",
        ],
      },
      {
        regionId: "commercial_notes",
        patchPaths: ["/notes"],
        locationHints: [
          "end note",
          "commercial note",
          "note at the end of the document",
        ],
        supportedBlocks: [],
        notes: [
          "Use only for generic end-of-document notes.",
          "Do not route service-page edits here.",
        ],
      },
      {
        regionId: buildCommercialDocumentContentRegionId("after-notes"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildCommercialDocumentContentRegionId("after-notes"),
          ),
        ],
        locationHints: ["under commercial notes", "after notes list"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for extra content directly after the notes list.",
        ],
      },
      {
        regionId: buildCommercialDocumentContentRegionId("after-info"),
        patchPaths: [
          buildDocumentContentBlocksPath(
            buildCommercialDocumentContentRegionId("after-info"),
          ),
        ],
        locationHints: ["under info line", "below the warranty and info block", "above signature"],
        supportedBlocks: [...quoteRichBlockTypes],
        notes: [
          "Use this stable keyed region for content between the warranty/info area and the signature block.",
        ],
      },
    ],
    notes: [
      "Generic notes and special conditions render here near the end of the document.",
      "Do not patch /notes for content that must appear inside a service pricing page.",
      "Use the stable keyed commercial regions for inserted content around the commercial lists and info block.",
    ],
  });

  if (data.includeTermsAndConditions !== false) {
    pushEntry({
      pageStart: page,
      pageEnd: page,
      title: "Terms and conditions",
      kind: "terms",
      editTargets: [
        "/includeTermsAndConditions",
        buildDocumentContentBlocksPath(
          buildTermsDocumentContentRegionId("before-sections"),
        ),
        buildDocumentContentBlocksPath(
          buildTermsDocumentContentRegionId("after-sections"),
        ),
      ],
      editableRegions: [
        {
          regionId: "terms_visibility",
          patchPaths: ["/includeTermsAndConditions"],
          locationHints: ["terms page", "remove terms page", "hide legal page"],
          supportedBlocks: [],
          notes: [
            "Legal page is structural only in the current renderer contract.",
          ],
        },
        {
          regionId: buildTermsDocumentContentRegionId("before-sections"),
          patchPaths: [
            buildDocumentContentBlocksPath(
              buildTermsDocumentContentRegionId("before-sections"),
            ),
          ],
          locationHints: ["top of terms page", "before legal sections"],
          supportedBlocks: [...quoteRichBlockTypes],
          notes: [
            "Use this stable keyed region for content inserted before the legal sections begin.",
          ],
        },
        {
          regionId: buildTermsDocumentContentRegionId("after-sections"),
          patchPaths: [
            buildDocumentContentBlocksPath(
              buildTermsDocumentContentRegionId("after-sections"),
            ),
          ],
          locationHints: ["end of terms page", "after legal sections", "bottom of legal page"],
          supportedBlocks: [...quoteRichBlockTypes],
          notes: [
            "Use this stable keyed region for content inserted after the legal sections.",
          ],
        },
      ],
      notes: [
        "Legal/terms page at the end of the document.",
        "Use the stable keyed terms regions for inserted content before or after the legal sections.",
      ],
    });
  }

  return entries;
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
    lowerServices.some(
      (value) => value.includes("service") || value.includes("maintenance"),
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
    checklist.push(
      "Validate who is preparing the quote and which identity/title should appear on the PDF.",
    );
  }

  if (preparedFor.length === 0) {
    checklist.push(
      "Validate who the quote is prepared for and which customer-facing recipient should appear on the cover.",
    );
  }

  if (
    !sanitizeText(data.contactInfo?.name) ||
    !sanitizeText(data.contactInfo?.company)
  ) {
    checklist.push("Validate the customer contact block for the final PDF.");
  }

  if (
    !sanitizeText(data.contactInfo?.email) ||
    !sanitizeText(data.contactInfo?.phone)
  ) {
    checklist.push(
      "Validate the customer contact email and phone before render.",
    );
  }

  if (!sanitizeText(data.projectSummary?.description)) {
    checklist.push(
      "Validate the project summary or assumptions so the quote does not read like a draft.",
    );
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
    checklist.push(
      "Validate whether brochure-style optional sections should be included.",
    );
  }

  if ((data.services ?? []).some((service) => !sanitizeText(service.layout))) {
    checklist.push(
      "Validate the preferred service layout for detailed sections.",
    );
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
    const preparedBy =
      data.preparedBy?.map((person) => sanitizeText(person.name)) ??
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
    rows.flatMap((row) =>
      getEnabledOptionalSections(
        normalizeQuoteData(row.data as Partial<QuoteData>),
      ),
    ),
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
        return (
          normalizeKey(getCustomerName(rowData, asRecord(row.data))) ===
          customerKey
        );
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
  const qualityWarnings = [...readiness.qualityWarnings];
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
        source:
          "attachment evidenceQuotes + workbook facts + explicit user answers",
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
        source:
          "company_commercial_defaults + customer_memory.commercialDefaults",
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
        recommendedPaymentSchedule: !paymentTermsPresent
          ? equipmentHeavy
            ? "35 % à la signature, 15 % à la commande du matériel, 40 % en cours d'installation, 10 % à la fin des travaux"
            : "35 % à la signature, 65 % selon l'avancement des travaux"
          : undefined,
      },
      serviceSummaries: summarizeServices(data),
      rendererMap: buildRendererMap(data),
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
          const recentMemory = buildCustomerMemory(
            customerName,
            relatedCustomerQuotes,
          );
          if (!recentMemory && !customerAccountMemory) {
            return null;
          }

          return {
            accountId: customerAccountMemory?.accountId,
            customerName:
              customerAccountMemory?.displayName ??
              recentMemory?.customerName ??
              customerName,
            seenInQuotes:
              recentMemory?.seenInQuotes ?? relatedCustomerQuotes.length,
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
