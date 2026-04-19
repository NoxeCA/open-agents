import { and, eq } from "drizzle-orm";

import { downloadBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { quoteFiles } from "@/lib/db/schema";
import type { SpecDocument, SpecEnvelope } from "@/lib/json-render";
import type { QuoteRichContentBlock } from "@/lib/documents/quote/rich-content";
import type { QuoteData } from "@/lib/quote/schema";

type QuoteJsonRenderImageSrc = string;
type SpecNode = Record<string, unknown>;

const DEFAULT_SECTION_ORDER = [
  "cover",
  "overview",
  "services",
  "about",
  "culture",
  "leadership",
  "team",
  "partners",
  "commercial",
  "terms",
] as const;

type QuoteSectionKey = (typeof DEFAULT_SECTION_ORDER)[number];

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readArray<T = unknown>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getDocumentLabel(lang: "fr" | "en", value: unknown) {
  const text = readString(value);
  if (text) {
    return text.toUpperCase();
  }

  return lang === "fr" ? "PROPOSITION" : "PROPOSAL";
}

function getPageHeader(lang: "fr" | "en") {
  return lang === "fr" ? "PROPOSITION" : "PROPOSAL";
}

function getPreparedPeople(value: unknown) {
  return readArray<Record<string, unknown>>(value)
    .map((item) => ({ name: readString(item.name) }))
    .filter((item): item is { name: string } => Boolean(item.name));
}

function getContactInfo(
  data: QuoteData,
): {
  name: string;
  company: string;
  phone: string;
  email: string;
} {
  const record = readRecord(data.contactInfo);

  return {
    name:
      readString(record?.name) ??
      readString(readArray<Record<string, unknown>>(data.preparedBy)[0]?.name) ??
      "Noxe",
    company: readString(record?.company) ?? "Noxe",
    phone: readString(record?.phone) ?? "",
    email: readString(record?.email) ?? "",
  };
}

function getSectionSelections(data: QuoteData) {
  const selections = readArray<Record<string, unknown>>(
    data.documentPlan?.sectionSelections ??
      data.composition?.sectionSelections,
  );

  if (selections.length === 0) {
    return DEFAULT_SECTION_ORDER.filter((key) => {
      if (key === "about") return Boolean(data.includeAboutUs);
      if (key === "culture") return Boolean(data.includeCulture);
      if (key === "leadership") return Boolean(data.includeCeoMessage);
      if (key === "team") return Boolean(data.includeTeam);
      if (key === "partners") return Boolean(data.includePartners);
      if (key === "terms") return Boolean(data.includeTermsAndConditions);
      return true;
    });
  }

  return selections
    .map((selection) => ({
      key: readString(selection.key) as QuoteSectionKey | undefined,
      enabled:
        typeof selection.enabled === "boolean" ? selection.enabled : true,
    }))
    .filter(
      (selection): selection is { key: QuoteSectionKey; enabled: boolean } =>
        Boolean(
          selection.key &&
            DEFAULT_SECTION_ORDER.includes(selection.key as QuoteSectionKey),
        ),
    )
    .filter((selection) => selection.enabled)
    .map((selection) => selection.key);
}

function getRegionBlocks(
  data: QuoteData,
  regionId: string,
): QuoteRichContentBlock[] {
  const blocks = data.documentContent?.regions?.[regionId]?.blocks;
  return Array.isArray(blocks) ? blocks : [];
}

function resolveImageSrc(value: string): QuoteJsonRenderImageSrc {
  return value;
}

function blocksToSpecNodes(
  blocks: QuoteRichContentBlock[],
): SpecNode[] {
  return blocks.flatMap((block) => {
    switch (block.type) {
      case "heading":
        return [
          {
            type: "Heading",
            text: block.text,
            level:
              block.level === "h1" ? 1 : block.level === "h3" ? 3 : 2,
            align: block.align ?? "left",
          },
        ];
      case "paragraph":
        return [
          {
            type: "Paragraph",
            text: block.text,
            muted: block.tone === "muted",
            size: block.tone === "lead" ? 12 : undefined,
            align: block.align ?? "left",
          },
        ];
      case "quote":
        return [
          {
            type: "Callout",
            title: block.attribution,
            text: block.text,
            variant: "neutral",
            showIcon: false,
          },
        ];
      case "list":
        return [
          {
            type: "BulletList",
            items: block.items,
            variant: block.ordered ? "arrow" : "dot",
          },
        ];
      case "table":
        return [
          ...(block.title
            ? [{ type: "Subheading", text: block.title } satisfies SpecNode]
            : []),
          {
            type: "Table",
            columns: block.columns.map((column) => ({
              header: column.label,
              align: column.align,
            })),
            rows: block.rows,
            compact: false,
            striped: true,
          },
          ...(block.caption
            ? [{ type: "Caption", text: block.caption } satisfies SpecNode]
            : []),
        ];
      case "image":
        return [
          {
            type: "Image",
            src: resolveImageSrc(block.src),
            align: block.align ?? "left",
            width: block.widthPercent
              ? Math.round((block.widthPercent / 100) * 420)
              : undefined,
          },
          ...(block.caption
            ? [{ type: "Caption", text: block.caption } satisfies SpecNode]
            : []),
        ];
      case "stats":
        return [
          {
            type: "MetricGrid",
            columns:
              block.items.length >= 4 ? 4 : block.items.length === 2 ? 2 : 3,
            items: block.items.map((item) => ({
              label: item.label,
              value: item.value,
            })),
          },
        ];
      case "divider":
        return [{ type: "Divider" }];
      case "spacer":
        return [{ type: "Spacer", height: block.height }];
      default:
        return [];
    }
  });
}

function buildCoverPage(data: QuoteData): SpecNode {
  const contactInfo = getContactInfo(data);

  return {
    type: "Page",
    header: false,
    footer: "none",
    children: [
      {
        type: "CoverBlock",
        clientName: data.clientName,
        subtitle:
          readString(data.subtitle) ??
          (data.lang === "fr"
            ? `Proposition pour ${data.clientName || "le client"}`
            : `Proposal for ${data.clientName || "the client"}`),
        documentType: getDocumentLabel(data.lang, data.documentType),
        documentTitle:
          readString(data.documentTitle) ??
          readString(data.projectTitle) ??
          (data.lang === "fr"
            ? "Proposition sans titre"
            : "Untitled proposal"),
        quoteID: readString(data.quoteID) ?? "Q-0001",
        revision: data.revision ?? 1,
        quoteDate:
          readString(data.quoteDate) ??
          new Date().toISOString().slice(0, 10),
        validUntil:
          readString(data.validUntil) ??
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
            .toISOString()
            .slice(0, 10),
        preparedFor:
          getPreparedPeople(data.preparedFor).length > 0
            ? getPreparedPeople(data.preparedFor)
            : [{ name: data.clientName || "Client" }],
        preparedBy:
          getPreparedPeople(data.preparedBy).length > 0
            ? getPreparedPeople(data.preparedBy)
            : [{ name: contactInfo.name }],
      },
    ],
  };
}

function buildTocPage(
  lang: "fr" | "en",
  sectionRows: Array<{ label: string; sectionId: string }>,
): SpecNode | null {
  if (sectionRows.length === 0) {
    return null;
  }

  return {
    type: "Page",
    sectionId: "table-of-contents",
    header: getPageHeader(lang),
    children: [
      {
        type: "SectionHeader",
        name: lang === "fr" ? "Table des matieres" : "Table of Contents",
      },
      {
        type: "TocEntries",
        entries: sectionRows,
      },
    ],
  };
}

function buildSimpleContentPage(options: {
  sectionId: string;
  lang: "fr" | "en";
  title: string;
  number?: number;
  children: SpecNode[];
}) {
  return {
    type: "Page",
    sectionId: options.sectionId,
    header: getPageHeader(options.lang),
    children: [
      {
        type: "SectionHeader",
        number: options.number,
        name: options.title,
      },
      ...options.children,
    ],
  };
}

function buildAboutPage(data: QuoteData): SpecNode {
  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "about-us",
    number: 1,
    title: data.lang === "fr" ? "A propos de nous" : "About Us",
    children: [
      {
        type: "Paragraph",
        text:
          data.lang === "fr"
            ? "Noxe transforme des besoins techniques complexes en propositions claires, executables et convaincantes."
            : "Noxe turns technically dense project needs into proposals clients can trust and teams can execute.",
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "about-us:after-intro")),
      ...blocksToSpecNodes(getRegionBlocks(data, "about-us:body")),
      ...blocksToSpecNodes(getRegionBlocks(data, "about-us:footer")),
    ],
  });
}

function buildCulturePage(data: QuoteData): SpecNode {
  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "culture",
    number: 2,
    title: data.lang === "fr" ? "Notre culture" : "Our Culture",
    children: [
      {
        type: "BulletList",
        items:
          data.lang === "fr"
            ? [
                "Coordination transparente entre ventes, conception et execution.",
                "Portee documentee de facon stricte pour limiter les zones grises.",
                "Decisions de chantier rapides pour garder le projet fluide.",
              ]
            : [
                "Transparent coordination between sales, design, and field delivery.",
                "Strict scope framing to reduce gray areas before execution begins.",
                "Fast field decisions to keep the project moving.",
              ],
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "culture:after-intro")),
      ...blocksToSpecNodes(getRegionBlocks(data, "culture:body")),
      ...blocksToSpecNodes(getRegionBlocks(data, "culture:footer")),
    ],
  });
}

function buildLeadershipPage(data: QuoteData): SpecNode {
  const ceo = data.ceo;
  const contactInfo = getContactInfo(data);
  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "leadership",
    number: 3,
    title: data.lang === "fr" ? "Direction" : "Leadership",
    children: [
      {
        type: "CeoMessageCard",
        name: contactInfo.name,
        title:
          data.lang === "fr" ? "DIRECTION NOXE" : "NOXE LEADERSHIP",
        message:
          ceo?.message ||
          (data.lang === "fr"
            ? "Nous voulons que cette proposition donne confiance des le premier regard: une portee claire, des engagements realistes et une execution rigoureuse."
            : "We want this proposal to create confidence immediately: clear scope, realistic commitments, and disciplined execution."),
        pills: ceo?.values ? [...ceo.values] : [],
      },
    ],
  });
}

function buildTeamPage(data: QuoteData): SpecNode {
  const members = readArray<Record<string, unknown>>(data.team).map((member) => ({
    role: readString(member.role) ?? "Team",
    name: readString(member.name) ?? "Member",
    bio: readString(member.description),
    skills: readArray<string>(member.skills).slice(0, 5).map((skill) => ({
      name: skill,
      level: 85,
    })),
  }));

  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "team",
    number: 4,
    title: data.lang === "fr" ? "Equipe" : "Team",
    children: [
      ...(members.length > 0
        ? [
            {
              type: "TeamCard",
              columns: members.length >= 3 ? 3 : members.length === 2 ? 2 : 1,
              members,
            } satisfies SpecNode,
          ]
        : []),
      ...blocksToSpecNodes(getRegionBlocks(data, "team:after-intro")),
      ...blocksToSpecNodes(getRegionBlocks(data, "team:body")),
      ...blocksToSpecNodes(getRegionBlocks(data, "team:footer")),
    ],
  });
}

function buildPartnersPage(data: QuoteData): SpecNode {
  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "partners",
    number: 5,
    title: data.lang === "fr" ? "Partenaires" : "Partners",
    children: [
      {
        type: "PartnerGrid",
        columns: 4,
        partners:
          data.lang === "fr"
            ? ["Genetec", "HID", "Axis", "Salto"]
            : ["Genetec", "HID", "Axis", "Salto"],
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "partners:after-intro")),
      ...blocksToSpecNodes(getRegionBlocks(data, "partners:body")),
      ...blocksToSpecNodes(getRegionBlocks(data, "partners:footer")),
    ],
  });
}

function buildOverviewPage(data: QuoteData): SpecNode {
  const proposalBlocks = blocksToSpecNodes(getRegionBlocks(data, "proposal:body"));
  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "overview",
    number: 6,
    title: data.lang === "fr" ? "Vue d'ensemble" : "Overview",
    children: [
      ...(readString(data.projectIntro)
        ? [
            {
              type: "Paragraph",
              text: data.projectIntro,
              size: 11,
            } satisfies SpecNode,
          ]
        : []),
      ...readArray<string>(data.proposal.paragraphs).map((paragraph) => ({
        type: "Paragraph",
        text: paragraph,
      })),
      ...proposalBlocks,
      ...blocksToSpecNodes(getRegionBlocks(data, "proposal:after-object")),
      ...blocksToSpecNodes(getRegionBlocks(data, "proposal:after-paragraphs")),
      ...blocksToSpecNodes(getRegionBlocks(data, "proposal:footer")),
    ],
  });
}

function buildSummaryPage(data: QuoteData): SpecNode {
  const rows = data.services.map((service) => ({
    label: service.sectionName,
    amount: service.totalCost,
  }));

  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "commercial-summary",
    number: 7,
    title: data.lang === "fr" ? "Sommaire financier" : "Financial Summary",
    children: [
      ...blocksToSpecNodes(getRegionBlocks(data, "summary:before-table")),
      ...(rows.length > 0
        ? [
            {
              type: "SummaryTable",
              rows,
              subtotalLabel:
                data.lang === "fr" ? "Sous-total" : "Subtotal",
              subtotalAmount: data.projectSummary.subtotal,
            } satisfies SpecNode,
          ]
        : []),
      ...blocksToSpecNodes(getRegionBlocks(data, "summary:after-table")),
      {
        type: "TotalCostBox",
        amount: data.projectSummary.totalProjectCost,
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "summary:after-total")),
      {
        type: "TaxDisclaimer",
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "summary:after-tax")),
    ],
  });
}

function buildCommercialPage(data: QuoteData): SpecNode {
  const contactInfo = getContactInfo(data);
  const contactRows = [
    {
      label: data.lang === "fr" ? "Nom" : "Name",
      value: contactInfo.name,
    },
    {
      label: data.lang === "fr" ? "Entreprise" : "Company",
      value: contactInfo.company,
    },
    {
      label: data.lang === "fr" ? "Telephone" : "Phone",
      value: contactInfo.phone,
    },
    {
      label: "Email",
      value: contactInfo.email,
    },
  ].filter((row) => row.value.trim().length > 0);

  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "commercial",
    number: 8,
    title:
      data.lang === "fr" ? "Cadre commercial" : "Commercial Framework",
    children: [
      {
        type: "Subheading",
        text: data.lang === "fr" ? "Exclusions" : "Exclusions",
      },
      {
        type: "BulletList",
        items:
          data.exclusions.length > 0
            ? data.exclusions
            : [
                data.lang === "fr"
                  ? "Aucune exclusion detaillee pour le moment."
                  : "No exclusions yet.",
              ],
        variant: "dash",
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "commercial:after-exclusions")),
      {
        type: "Subheading",
        text: data.lang === "fr" ? "Modalites de paiement" : "Payment Terms",
      },
      {
        type: "BulletList",
        items:
          data.paymentTerms.length > 0
            ? data.paymentTerms
            : [
                data.lang === "fr"
                  ? "Modalites a confirmer."
                  : "Payment terms to be confirmed.",
              ],
        variant: "arrow",
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "commercial:after-payment-terms")),
      ...(data.specialConditions.length > 0
        ? [
            {
              type: "Subheading",
              text:
                data.lang === "fr"
                  ? "Conditions speciales"
                  : "Special Conditions",
            } satisfies SpecNode,
            {
              type: "BulletList",
              items: data.specialConditions,
              variant: "dash",
            } satisfies SpecNode,
          ]
        : []),
      ...blocksToSpecNodes(getRegionBlocks(data, "commercial:after-special-conditions")),
      ...(data.notes.length > 0
        ? [
            {
              type: "Subheading",
              text: data.lang === "fr" ? "Notes" : "Notes",
            } satisfies SpecNode,
            {
              type: "BulletList",
              items: data.notes,
              variant: "dot",
            } satisfies SpecNode,
          ]
        : []),
      ...blocksToSpecNodes(getRegionBlocks(data, "commercial:after-notes")),
      {
        type: "KeyValueTable",
        rows: contactRows,
        columns: 2,
      },
      ...blocksToSpecNodes(getRegionBlocks(data, "commercial:after-info")),
    ],
  });
}

function buildTermsPage(data: QuoteData): SpecNode {
  const sections = [
    ...(data.paymentTerms.length > 0
      ? [
          {
            title: data.lang === "fr" ? "Paiement" : "Payment",
            text: data.paymentTerms.join("\n"),
          },
        ]
      : []),
    ...(data.exclusions.length > 0
      ? [
          {
            title: data.lang === "fr" ? "Exclusions" : "Exclusions",
            text: data.exclusions.join("\n"),
          },
        ]
      : []),
  ];

  return buildSimpleContentPage({
    lang: data.lang,
    sectionId: "terms",
    number: 9,
    title:
      data.lang === "fr"
        ? "Conditions generales"
        : "Terms and Conditions",
    children: [
      ...blocksToSpecNodes(getRegionBlocks(data, "terms:before-sections")),
      ...(sections.length > 0
        ? [
            {
              type: "TermsAndConditions",
              columns: 2,
              sections,
            } satisfies SpecNode,
          ]
        : []),
      ...blocksToSpecNodes(getRegionBlocks(data, "terms:after-sections")),
    ],
  });
}

function buildAppendixPages(data: QuoteData): SpecNode[] {
  return readArray<Record<string, unknown>>(data.optionalPages).map(
    (page, index) => {
      const title =
        readString(page.pageTitle) ??
        readString(page.title) ??
        `Appendix ${index + 1}`;
      const bodyBlocks = blocksToSpecNodes(
        getRegionBlocks(data, `optional:${index}:body`),
      );

      return {
        type: "Page",
        sectionId: `appendix-${index + 1}`,
        header: getPageHeader(data.lang),
        children: [
          {
            type: "SectionHeader",
            name: title,
          },
          ...blocksToSpecNodes(getRegionBlocks(data, `optional:${index}:after-title`)),
          ...(readString(page.text)
            ? [{ type: "Paragraph", text: readString(page.text)! } satisfies SpecNode]
            : []),
          ...bodyBlocks,
          ...blocksToSpecNodes(getRegionBlocks(data, `optional:${index}:footer`)),
        ],
      };
    },
  );
}

function buildServiceNodes(data: QuoteData): SpecNode[] {
  return data.services.map((service, index) => ({
    type: "ServiceSection",
    projectTitle:
      readString(data.projectTitle) ??
      readString(data.documentTitle) ??
      "Project",
    projectIntro: readString(data.projectIntro),
    showProjectIntro: index === 0 && Boolean(readString(data.projectIntro)),
    sectionId: slugify(`service-${service.sectionNumber}-${service.sectionName}`),
    sectionNumber: service.sectionNumber,
    sectionName: service.sectionName,
    description: service.description,
    totalCost: service.totalCost,
    layout:
      data.composition?.serviceLayout ??
      data.documentPlan?.serviceLayoutPolicy ??
      service.layout,
    bomItems: service.bomItems,
    bomSubtotal: service.bomSubtotal,
    laborCategories: service.laborCategories,
    laborSubtotal: service.laborSubtotal,
  }));
}

export function buildQuoteJsonRenderEnvelope(data: QuoteData): SpecEnvelope {
  const enabledSections = getSectionSelections(data);
  const tocRows: Array<{ label: string; sectionId: string }> = [];
  const children: SpecNode[] = [buildCoverPage(data)];

  const pushSection = (label: string, sectionId: string, node: SpecNode | null) => {
    if (!node) return;
    tocRows.push({ label, sectionId });
    children.push(node);
  };

  if (enabledSections.includes("about")) {
    pushSection(data.lang === "fr" ? "A propos de nous" : "About Us", "about-us", buildAboutPage(data));
  }
  if (enabledSections.includes("culture")) {
    pushSection(data.lang === "fr" ? "Culture" : "Culture", "culture", buildCulturePage(data));
  }
  if (enabledSections.includes("leadership")) {
    pushSection(data.lang === "fr" ? "Direction" : "Leadership", "leadership", buildLeadershipPage(data));
  }
  if (enabledSections.includes("team")) {
    pushSection(data.lang === "fr" ? "Equipe" : "Team", "team", buildTeamPage(data));
  }
  if (enabledSections.includes("partners")) {
    pushSection(data.lang === "fr" ? "Partenaires" : "Partners", "partners", buildPartnersPage(data));
  }
  if (enabledSections.includes("overview")) {
    pushSection(data.lang === "fr" ? "Vue d'ensemble" : "Overview", "overview", buildOverviewPage(data));
  }
  if (enabledSections.includes("services")) {
    for (const serviceNode of buildServiceNodes(data)) {
      tocRows.push({
        label: String(serviceNode.sectionName ?? "Service"),
        sectionId: String(serviceNode.sectionId),
      });
      children.push(serviceNode);
    }
  }
  if (enabledSections.includes("commercial")) {
    pushSection(
      data.lang === "fr" ? "Sommaire financier" : "Financial Summary",
      "commercial-summary",
      buildSummaryPage(data),
    );
    pushSection(
      data.lang === "fr" ? "Cadre commercial" : "Commercial Framework",
      "commercial",
      buildCommercialPage(data),
    );
  }
  if (enabledSections.includes("terms")) {
    pushSection(
      data.lang === "fr" ? "Conditions generales" : "Terms and Conditions",
      "terms",
      buildTermsPage(data),
    );
  }

  for (const appendix of buildAppendixPages(data)) {
    const appendixRecord = appendix as Record<string, unknown>;
    const appendixChildren = Array.isArray(appendixRecord.children)
      ? appendixRecord.children
      : [];
    const firstChild = readRecord(appendixChildren[0]);
    const appendixLabel =
      typeof firstChild?.name === "string" && firstChild.name.length > 0
        ? firstChild.name
        : "Appendix";

    tocRows.push({
      label: String(appendixLabel),
      sectionId: String(appendixRecord.sectionId),
    });
    children.push(appendix);
  }

  const tocPage = buildTocPage(data.lang, tocRows);
  if (tocPage) {
    children.splice(1, 0, tocPage);
  }

  return {
    version: 1,
    brand: {
      translations: data.lang,
    },
    attachments: data.attachedDocuments,
    document: {
      type: "Document",
      lang: data.lang,
      children,
    },
  };
}

function readPersistedSpecValue(
  data: Partial<QuoteData> & Record<string, unknown>,
): unknown {
  const jsonRenderRecord = readRecord(data.jsonRender);

  return (
    jsonRenderRecord?.spec ??
    data.jsonRenderDraft ??
    data.jsonRenderDocument ??
    data.jsonRenderSpec ??
    readRecord(data.document)?.jsonRenderDocument ??
    readRecord(data.document)?.jsonRenderSpec ??
    null
  );
}

function isSeededPlaceholderSpec(candidate: unknown): boolean {
  const record = readRecord(candidate);
  const document = readRecord(record?.document);
  const children = Array.isArray(document?.children) ? document.children : null;
  if (!children || children.length !== 1) {
    return false;
  }

  const firstPage = readRecord(children[0]);
  if (!firstPage || firstPage.type !== "Page") {
    return false;
  }

  if (firstPage.header !== false || firstPage.footer !== "none") {
    return false;
  }

  const pageChildren = Array.isArray(firstPage.children) ? firstPage.children : null;
  if (!pageChildren || pageChildren.length !== 3) {
    return false;
  }

  const [labelNode, headingNode, paragraphNode] = pageChildren.map((child) =>
    readRecord(child),
  );

  const labelText = readRecord(labelNode?.text);
  const headingText = readRecord(headingNode?.text);
  const paragraphText = readRecord(paragraphNode?.text);

  return (
    labelNode?.type === "Label" &&
    labelNode.uppercase === true &&
    labelText?.$state === "quote.documentType" &&
    headingNode?.type === "Heading" &&
    headingNode.level === 1 &&
    headingText?.$state === "quote.documentTitle" &&
    paragraphNode?.type === "Paragraph" &&
    paragraphNode.muted === true &&
    paragraphText?.$state === "quote.projectIntro"
  );
}

export function getPersistedQuoteJsonRenderEnvelope(
  data: Partial<QuoteData> & Record<string, unknown>,
): SpecEnvelope | SpecDocument | null {
  const candidate = readPersistedSpecValue(data);
  if (isSeededPlaceholderSpec(candidate)) {
    return null;
  }
  return readRecord(candidate)
    ? (candidate as SpecEnvelope | SpecDocument)
    : null;
}

async function resolveQuoteFileImageSrc(
  src: string,
  quoteId?: string,
): Promise<string> {
  if (!src.startsWith("quote-file:")) {
    return src;
  }

  const fileId = src.slice("quote-file:".length);
  if (!fileId) {
    return src;
  }

  const filters = quoteId
    ? and(eq(quoteFiles.id, fileId), eq(quoteFiles.quoteId, quoteId))
    : eq(quoteFiles.id, fileId);
  const [row] = await db.select().from(quoteFiles).where(filters).limit(1);

  if (!row || !row.mediaType.startsWith("image/")) {
    return src;
  }

  const bytes = Buffer.from(await downloadBlob(row.blobUrl));
  return `data:${row.mediaType};base64,${bytes.toString("base64")}`;
}

async function resolveSpecImages(
  value: unknown,
  quoteId?: string,
): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => resolveSpecImages(item, quoteId)));
  }

  const record = readRecord(value);
  if (!record) {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(record)) {
    if (
      key === "src" &&
      typeof child === "string" &&
      readString(record.type) === "Image"
    ) {
      next[key] = await resolveQuoteFileImageSrc(child, quoteId);
      continue;
    }

    next[key] = await resolveSpecImages(child, quoteId);
  }

  return next;
}

export async function resolveQuoteJsonRenderEnvelope(
  data: QuoteData,
  options?: { quoteId?: string },
): Promise<SpecEnvelope | SpecDocument> {
  const persisted =
    getPersistedQuoteJsonRenderEnvelope(
      data as Partial<QuoteData> & Record<string, unknown>,
    ) ?? buildQuoteJsonRenderEnvelope(data);

  return (await resolveSpecImages(
    persisted,
    options?.quoteId,
  )) as SpecEnvelope | SpecDocument;
}
