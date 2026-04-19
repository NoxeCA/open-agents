import type { Spec } from "@json-render/core";

import type { QuoteData } from "../schema";
import {
  quoteDocumentAccentPresets,
  quoteDocumentDensityPresets,
  quoteDocumentSectionCatalog,
  quoteDocumentThemePresets,
  type QuoteDocumentAccent,
  type QuoteDocumentDensity,
  type QuoteDocumentSection,
  type QuoteDocumentSectionKind,
  type QuoteDocumentState,
  type QuoteDocumentTheme,
} from "./catalog";

type QuoteDocumentSeed = Partial<QuoteDocumentState> | null | undefined;

type LocalizedCopy = {
  documentLabel: string;
  coverEyebrow: string;
  overviewLabel: string;
  servicesLabel: string;
  commercialLabel: string;
  nextStepsLabel: string;
  proposalSnapshot: string;
  scopeStructure: string;
  projectedTotal: string;
  projectIntent: string;
  whyNoxe: string;
  waysOfWorking: string;
  leadershipNote: string;
  deliveryTeam: string;
  ecosystem: string;
  commercialTerms: string;
  exclusions: string;
  paymentTerms: string;
  specialConditions: string;
  notes: string;
  preparedFor: string;
  preparedBy: string;
  contact: string;
  noExclusions: string;
  noSpecialConditions: string;
  noNotes: string;
  noPaymentTerms: string;
  noServices: string;
  optionalPartnerFallback: string[];
  cultureBullets: string[];
  aboutParagraphs: string[];
  defaultLeadership: string;
  leadershipValues: string[];
};

const COPY: Record<"fr" | "en", LocalizedCopy> = {
  fr: {
    documentLabel: "Proposition",
    coverEyebrow: "Proposition client",
    overviewLabel: "Vue d'ensemble",
    servicesLabel: "Portee et services",
    commercialLabel: "Cadre commercial",
    nextStepsLabel: "Prochaines etapes",
    proposalSnapshot: "Lecture rapide",
    scopeStructure: "Structure de la portee",
    projectedTotal: "Cout projet",
    projectIntent: "Intention du projet",
    whyNoxe: "Pourquoi Noxe",
    waysOfWorking: "Notre facon de livrer",
    leadershipNote: "Mot de la direction",
    deliveryTeam: "Equipe de livraison",
    ecosystem: "Ecosysteme technique",
    commercialTerms: "Conditions commerciales",
    exclusions: "Exclusions",
    paymentTerms: "Modalites de paiement",
    specialConditions: "Conditions speciales",
    notes: "Notes",
    preparedFor: "Prepare pour",
    preparedBy: "Prepare par",
    contact: "Coordonnees",
    noExclusions: "Aucune exclusion detaillee pour le moment.",
    noSpecialConditions: "Aucune condition speciale detaillee pour le moment.",
    noNotes: "Aucune note additionnelle detaillee pour le moment.",
    noPaymentTerms:
      "Les modalites de paiement restent a confirmer avant emission finale.",
    noServices:
      "Les lots de travail doivent encore etre structures en sections client.",
    optionalPartnerFallback: [
      "Fabricants approuves",
      "Metiers specialises",
      "Partenaires terrain",
    ],
    cultureBullets: [
      "Coordination transparente entre ventes, conception et execution.",
      "Portee documentee de facon stricte pour limiter les zones grises.",
      "Decisions de chantier tracees rapidement pour garder le projet fluide.",
    ],
    aboutParagraphs: [
      "Noxe transforme des besoins techniques complexes en propositions claires, vendables et executables.",
      "Notre approche privilegie une portee nette, une lecture commerciale simple et une livraison terrain sans ambiguite.",
    ],
    defaultLeadership:
      "Nous voulons que cette proposition donne confiance des le premier regard: une portee claire, des engagements realistes et une execution qui protege votre calendrier.",
    leadershipValues: ["Clarte", "Rigueur", "Presence terrain"],
  },
  en: {
    documentLabel: "Proposal",
    coverEyebrow: "Client proposal",
    overviewLabel: "Overview",
    servicesLabel: "Scope and services",
    commercialLabel: "Commercial frame",
    nextStepsLabel: "Next steps",
    proposalSnapshot: "Proposal snapshot",
    scopeStructure: "Scope structure",
    projectedTotal: "Project total",
    projectIntent: "Project intent",
    whyNoxe: "Why Noxe",
    waysOfWorking: "How we deliver",
    leadershipNote: "Leadership note",
    deliveryTeam: "Delivery team",
    ecosystem: "Technical ecosystem",
    commercialTerms: "Commercial terms",
    exclusions: "Exclusions",
    paymentTerms: "Payment terms",
    specialConditions: "Special conditions",
    notes: "Notes",
    preparedFor: "Prepared for",
    preparedBy: "Prepared by",
    contact: "Contact",
    noExclusions: "No detailed exclusions have been drafted yet.",
    noSpecialConditions: "No special conditions have been drafted yet.",
    noNotes: "No additional notes have been drafted yet.",
    noPaymentTerms:
      "Payment terms still need final confirmation before the client-facing issue.",
    noServices:
      "The work packages still need to be structured into client-facing sections.",
    optionalPartnerFallback: [
      "Approved manufacturers",
      "Specialty trades",
      "Field partners",
    ],
    cultureBullets: [
      "Transparent coordination between sales, design, and field delivery.",
      "Strict scope framing to reduce gray areas before execution begins.",
      "Fast field decisions and documented tradeoffs to keep the project moving.",
    ],
    aboutParagraphs: [
      "Noxe turns technically dense project needs into proposals clients can trust and teams can execute.",
      "Our work balances commercial clarity, disciplined scope ownership, and field-ready delivery decisions.",
    ],
    defaultLeadership:
      "We want this proposal to create confidence immediately: clear scope, realistic commitments, and execution discipline that protects your schedule.",
    leadershipValues: ["Clarity", "Rigor", "Field presence"],
  },
};

const CORE_SECTION_ORDER: QuoteDocumentSectionKind[] = [
  "cover",
  "overview",
  "services",
  "commercial",
];

const OPTIONAL_SECTION_FLAGS: Partial<
  Record<QuoteDocumentSectionKind, keyof QuoteData>
> = {
  about: "includeAboutUs",
  culture: "includeCulture",
  leadership: "includeCeoMessage",
  team: "includeTeam",
  partners: "includePartners",
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unique(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const normalized = value.trim();
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    output.push(normalized);
  }

  return output;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function formatMoney(value: number | undefined, lang: "fr" | "en") {
  if (typeof value !== "number") return undefined;

  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: unknown, lang: "fr" | "en") {
  const asDate =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : null;

  if (!asDate || Number.isNaN(asDate.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(asDate);
}

function getLang(data: Partial<QuoteData>) {
  return data.lang === "en" ? "en" : "fr";
}

function isOptionalSectionEnabled(
  data: Partial<QuoteData>,
  kind: QuoteDocumentSectionKind,
) {
  const flag = OPTIONAL_SECTION_FLAGS[kind];
  return flag ? Boolean(data[flag]) : true;
}

function getDefaultSectionTitle(
  kind: QuoteDocumentSectionKind,
  lang: "fr" | "en",
) {
  const copy = COPY[lang];

  switch (kind) {
    case "cover":
      return copy.documentLabel;
    case "overview":
      return copy.overviewLabel;
    case "services":
      return copy.servicesLabel;
    case "about":
      return copy.whyNoxe;
    case "culture":
      return copy.waysOfWorking;
    case "leadership":
      return copy.leadershipNote;
    case "team":
      return copy.deliveryTeam;
    case "partners":
      return copy.ecosystem;
    case "commercial":
      return copy.commercialLabel;
  }
}

function normalizeSectionOrder(
  data: Partial<QuoteData>,
  sections: QuoteDocumentSection[] | undefined,
): QuoteDocumentSection[] {
  const lang = getLang(data);
  const seeded =
    Array.isArray(sections) && sections.length > 0
      ? sections.filter((section) => section.enabled !== false)
      : [];

  const byKind = new Map<QuoteDocumentSectionKind, QuoteDocumentSection>();
  for (const section of seeded) {
    if (!isOptionalSectionEnabled(data, section.kind)) continue;
    if (!byKind.has(section.kind)) {
      byKind.set(section.kind, {
        ...section,
        enabled: true,
        variant: section.variant ?? "default",
        title: section.title ?? getDefaultSectionTitle(section.kind, lang),
      });
    }
  }

  for (const kind of CORE_SECTION_ORDER) {
    if (!byKind.has(kind)) {
        byKind.set(kind, {
          id: kind,
          kind,
          enabled: true,
          variant: "default",
          title: getDefaultSectionTitle(kind, lang),
        });
      }
  }

  for (const section of quoteDocumentSectionCatalog) {
    if (section.optional && isOptionalSectionEnabled(data, section.kind)) {
      if (!byKind.has(section.kind)) {
        byKind.set(section.kind, {
          id: section.kind,
          kind: section.kind,
          enabled: true,
          variant: "default",
          title: getDefaultSectionTitle(section.kind, lang),
        });
      }
    }
  }

  const orderedKinds = [
    ...seeded.map((section) => section.kind),
    ...CORE_SECTION_ORDER,
    ...quoteDocumentSectionCatalog
      .filter((section) => section.optional)
      .map((section) => section.kind),
  ];

  const output: QuoteDocumentSection[] = [];
  const seen = new Set<QuoteDocumentSectionKind>();

  for (const kind of orderedKinds) {
    if (seen.has(kind)) continue;
    const section = byKind.get(kind);
    if (!section) continue;
    seen.add(kind);
    output.push(section);
  }

  return output;
}

function sectionKey(section: QuoteDocumentSection) {
  return `${section.kind}-${slugify(section.id) || section.kind}`;
}

function readPeople(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = readRecord(item);
      if (!record) return null;
      const name = readString(record.name);
      if (!name) return null;

      return {
        name,
        role: readString(record.role),
        bio: readString(record.description),
        skills: Array.isArray(record.skills)
          ? record.skills
              .map((skill) => readString(skill))
              .filter((skill): skill is string => Boolean(skill))
          : [],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function readPersonNames(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = readRecord(item);
      return readString(record?.name);
    })
    .filter((item): item is string => Boolean(item));
}

function toSentenceList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
}

function buildAboutParagraphs(lang: "fr" | "en") {
  return COPY[lang].aboutParagraphs;
}

function buildHeroSummary(data: Partial<QuoteData>, lang: "fr" | "en") {
  const projectSummary = readRecord(data.projectSummary);
  const proposal = readRecord(data.proposal);
  const proposalParagraphs = Array.isArray(proposal?.paragraphs)
    ? proposal.paragraphs
        .map((paragraph) => readString(paragraph))
        .filter((paragraph): paragraph is string => Boolean(paragraph))
    : [];
  const description = readString(projectSummary?.description);
  const intro = readString(data.projectIntro);

  return proposalParagraphs[0] ?? description ?? intro ?? buildAboutParagraphs(lang)[0];
}

function buildHeroTitle(data: Partial<QuoteData>) {
  return (
    readString(data.documentTitle) ??
    readString(data.projectTitle) ??
    "Untitled proposal"
  );
}

function buildHeroSubtitle(data: Partial<QuoteData>, lang: "fr" | "en") {
  const preparedFor = readPersonNames(data.preparedFor);
  const clientName = readString(data.clientName);
  const subtitle = readString(data.subtitle);
  const target = preparedFor[0] ?? clientName;

  if (subtitle && target) {
    return lang === "fr"
      ? `${subtitle} pour ${target}`
      : `${subtitle} for ${target}`;
  }

  return subtitle ?? target;
}

function buildStats(data: Partial<QuoteData>, lang: "fr" | "en") {
  const copy = COPY[lang];
  const projectSummary = readRecord(data.projectSummary);
  const preparedFor = readPersonNames(data.preparedFor);
  const validUntil = formatDate(data.validUntil, lang);
  const total = formatMoney(
    readNumber(projectSummary?.totalProjectCost),
    lang,
  );
  const serviceCount = Array.isArray(data.services) ? data.services.length : 0;

  return [
    preparedFor[0]
      ? { label: copy.preparedFor, value: preparedFor[0] }
      : null,
    total ? { label: copy.projectedTotal, value: total } : null,
    serviceCount > 0
      ? {
          label: lang === "fr" ? "Lots" : "Sections",
          value: String(serviceCount),
        }
      : null,
    validUntil
      ? {
          label: lang === "fr" ? "Valide jusqu'au" : "Valid until",
          value: validUntil,
        }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
}

function buildOverviewParagraphs(data: Partial<QuoteData>, lang: "fr" | "en") {
  const projectSummary = readRecord(data.projectSummary);
  const proposal = readRecord(data.proposal);
  const output = [
    readString(projectSummary?.description),
    readString(data.projectIntro),
    ...(Array.isArray(proposal?.paragraphs)
      ? proposal.paragraphs.map((value) => readString(value))
      : []),
  ].filter((item): item is string => Boolean(item));

  if (output.length > 0) {
    return output.slice(0, 3);
  }

  return lang === "fr"
    ? [
        "Cette proposition structure la portee, le cadre commercial et les priorites d'execution de facon claire pour accelerer la prise de decision.",
      ]
    : [
        "This proposal frames the scope, commercial structure, and delivery priorities clearly so decisions can move faster.",
      ];
}

function buildServiceCards(data: Partial<QuoteData>, lang: "fr" | "en") {
  if (!Array.isArray(data.services) || data.services.length === 0) {
    return [
      {
        title: COPY[lang].servicesLabel,
        description: COPY[lang].noServices,
        meta: [],
      },
    ];
  }

  return data.services.map((service) => {
    const bomItems = Array.isArray(service.bomItems) ? service.bomItems.length : 0;
    const laborCategories = Array.isArray(service.laborCategories)
      ? service.laborCategories.length
      : 0;
    const meta = [
      bomItems > 0
        ? lang === "fr"
          ? `${bomItems} articles materiel`
          : `${bomItems} material items`
        : undefined,
      laborCategories > 0
        ? lang === "fr"
          ? `${laborCategories} categories de main-d'oeuvre`
          : `${laborCategories} labor categories`
        : undefined,
      service.layout
        ? lang === "fr"
          ? `Mode ${service.layout}`
          : `Layout ${service.layout}`
        : undefined,
    ].filter((item): item is string => Boolean(item));

    return {
      eyebrow:
        service.sectionNumber !== undefined
          ? lang === "fr"
            ? `Section ${service.sectionNumber}`
            : `Section ${service.sectionNumber}`
          : undefined,
      title: service.sectionName,
      description: readString(service.description),
      amount: formatMoney(readNumber(service.totalCost), lang),
      meta,
    };
  });
}

function buildTeamCards(data: Partial<QuoteData>, lang: "fr" | "en") {
  const explicitTeam = readPeople(data.team);
  if (explicitTeam.length > 0) {
    return explicitTeam;
  }

  const preparedBy = readPersonNames(data.preparedBy);
  if (preparedBy.length === 0) {
    return [];
  }

  return preparedBy.map((name, index) => ({
    name,
    role: lang === "fr" ? `Responsable ${index + 1}` : `Lead ${index + 1}`,
    bio:
      lang === "fr"
        ? "Point de contact principal pour la coordination du projet et la qualite d'execution."
        : "Primary contact for project coordination and execution quality.",
    skills:
      lang === "fr"
        ? ["Coordination", "Execution", "Suivi client"]
        : ["Coordination", "Execution", "Client follow-through"],
  }));
}

function buildPartnerLabels(data: Partial<QuoteData>, lang: "fr" | "en") {
  const labels = unique(
    (Array.isArray(data.services) ? data.services : []).flatMap((service) =>
      Array.isArray(service.bomItems)
        ? service.bomItems.map((item) => readString(item.oem))
        : [],
    ),
  );

  if (labels.length > 0) {
    return labels.slice(0, 8);
  }

  return COPY[lang].optionalPartnerFallback;
}

function buildCommercialBlocks(data: Partial<QuoteData>, lang: "fr" | "en") {
  const copy = COPY[lang];
  const blocks = [
    {
      title: copy.exclusions,
      tone: "warning" as const,
      items: toSentenceList(data.exclusions),
      empty: copy.noExclusions,
    },
    {
      title: copy.paymentTerms,
      tone: "warm" as const,
      items: toSentenceList(data.paymentTerms),
      empty: copy.noPaymentTerms,
    },
    {
      title: copy.specialConditions,
      tone: "neutral" as const,
      items: toSentenceList(data.specialConditions),
      empty: copy.noSpecialConditions,
    },
    {
      title: copy.notes,
      tone: "neutral" as const,
      items: toSentenceList(data.notes),
      empty: copy.noNotes,
    },
  ];

  return blocks.map((block) => ({
    ...block,
    items: block.items.length > 0 ? block.items : [block.empty],
  }));
}

function buildContactLines(data: Partial<QuoteData>, lang: "fr" | "en") {
  const contact = readRecord(data.contactInfo);
  const lines = [
    readString(contact?.name),
    readString(contact?.company),
    readString(contact?.phone),
    readString(contact?.email),
  ].filter((item): item is string => Boolean(item));

  if (lines.length > 0) return lines;

  return lang === "fr"
    ? ["Coordonnees finales a confirmer"]
    : ["Final contact block still to be confirmed"];
}

type MutableSpec = {
  root: string;
  elements: Record<
    string,
    {
      type: string;
      props: Record<string, unknown>;
      children: string[];
    }
  >;
};

function createElement(
  spec: MutableSpec,
  key: string,
  type: string,
  props: Record<string, unknown>,
  children: string[] = [],
) {
  spec.elements[key] = {
    type,
    props,
    children,
  };
}

function appendElement(
  spec: MutableSpec,
  parentKey: string,
  key: string,
  type: string,
  props: Record<string, unknown>,
  children: string[] = [],
) {
  createElement(spec, key, type, props, children);
  spec.elements[parentKey]?.children.push(key);
}

function getChromeProps(
  document: Omit<QuoteDocumentState, "spec">,
  lang: "fr" | "en",
) {
  return {
    density: document.density,
    accent: document.accent,
    lang,
  };
}

function buildSectionPage(
  spec: MutableSpec,
  data: Partial<QuoteData>,
  document: Omit<QuoteDocumentState, "spec">,
  section: QuoteDocumentSection,
) {
  const lang = getLang(data);
  const copy = COPY[lang];
  const chrome = getChromeProps(document, lang);
  const pageKey = `page-${sectionKey(section)}`;
  createElement(spec, pageKey, "ProposalPage", {
    label: section.title ?? getDefaultSectionTitle(section.kind, lang),
    eyebrow: section.eyebrow,
    tone:
      section.kind === "cover"
        ? "cover"
        : section.kind === "commercial"
          ? "commercial"
          : section.kind === "services"
            ? "scope"
            : "story",
    ...chrome,
  });
  spec.elements[spec.root]?.children.push(pageKey);

  switch (section.kind) {
    case "cover": {
      appendElement(spec, pageKey, `${pageKey}-hero`, "HeroSection", {
        eyebrow: section.eyebrow ?? copy.coverEyebrow,
        title: buildHeroTitle(data),
        subtitle: buildHeroSubtitle(data, lang),
        summary: buildHeroSummary(data, lang),
        badge: [
          readString(data.quoteID),
          formatDate(data.quoteDate, lang),
          formatDate(data.validUntil, lang),
        ]
          .filter((item): item is string => Boolean(item))
          .join(" • "),
        ...chrome,
      });

      const stats = buildStats(data, lang);
      if (stats.length > 0) {
        appendElement(spec, pageKey, `${pageKey}-stats`, "StatsGrid", {
          title: copy.proposalSnapshot,
          items: stats,
          ...chrome,
        });
      }

      appendElement(spec, pageKey, `${pageKey}-contact`, "ContactStrip", {
        title: copy.nextStepsLabel,
        preparedFor: readPersonNames(data.preparedFor),
        preparedBy: readPersonNames(data.preparedBy),
        contactLines: buildContactLines(data, lang),
        ...chrome,
      });
      break;
    }

    case "overview": {
      appendElement(spec, pageKey, `${pageKey}-narrative`, "NarrativeSection", {
        title: section.title ?? copy.projectIntent,
        eyebrow: section.eyebrow ?? copy.overviewLabel,
        paragraphs: buildOverviewParagraphs(data, lang),
        ...chrome,
      });

      const stats = buildStats(data, lang);
      if (stats.length > 0) {
        appendElement(spec, pageKey, `${pageKey}-stats`, "StatsGrid", {
          title: copy.proposalSnapshot,
          items: stats,
          ...chrome,
        });
      }

      const total = formatMoney(
        readNumber(readRecord(data.projectSummary)?.totalProjectCost),
        lang,
      );
      if (total) {
        appendElement(
          spec,
          pageKey,
          `${pageKey}-total`,
          "TotalsHighlight",
          {
            title: copy.projectedTotal,
            amount: total,
            caption:
              lang === "fr"
                ? "Projection actuelle selon les donnees du devis."
                : "Current projection from the active quote data.",
            ...chrome,
          },
        );
      }
      break;
    }

    case "services": {
      appendElement(
        spec,
        pageKey,
        `${pageKey}-services`,
        "ServiceCardsSection",
        {
          title: section.title ?? copy.scopeStructure,
          eyebrow: section.eyebrow ?? copy.servicesLabel,
          intro:
            lang === "fr"
              ? "Chaque section ci-dessous traduit la portee en blocs lisibles pour la decision commerciale."
              : "Each section below translates the scope into client-readable decision blocks.",
          items: buildServiceCards(data, lang),
          ...chrome,
        },
      );
      break;
    }

    case "about": {
      appendElement(spec, pageKey, `${pageKey}-about`, "NarrativeSection", {
        title: section.title ?? copy.whyNoxe,
        eyebrow: section.eyebrow ?? copy.coverEyebrow,
        paragraphs: buildAboutParagraphs(lang),
        ...chrome,
      });
      break;
    }

    case "culture": {
      appendElement(spec, pageKey, `${pageKey}-culture`, "BulletListSection", {
        title: section.title ?? copy.waysOfWorking,
        eyebrow: section.eyebrow ?? copy.overviewLabel,
        items: copy.cultureBullets,
        tone: "warm",
        ...chrome,
      });
      break;
    }

    case "leadership": {
      const ceo = readRecord(data.ceo);
      appendElement(spec, pageKey, `${pageKey}-message`, "NarrativeSection", {
        title: section.title ?? copy.leadershipNote,
        eyebrow: section.eyebrow ?? copy.coverEyebrow,
        paragraphs: [readString(ceo?.message) ?? copy.defaultLeadership],
        ...chrome,
      });

      appendElement(spec, pageKey, `${pageKey}-values`, "BulletListSection", {
        title: lang === "fr" ? "Valeurs mises de l'avant" : "Values reinforced",
        items:
          Array.isArray(ceo?.values) && ceo.values.length > 0
            ? ceo.values
                .map((value) => readString(value))
                .filter((value): value is string => Boolean(value))
            : copy.leadershipValues,
        tone: "neutral",
        ...chrome,
      });
      break;
    }

    case "team": {
      const people = buildTeamCards(data, lang);
      if (people.length > 0) {
        appendElement(spec, pageKey, `${pageKey}-people`, "PeopleGridSection", {
          title: section.title ?? copy.deliveryTeam,
          eyebrow: section.eyebrow ?? copy.preparedBy,
          intro:
            lang === "fr"
              ? "Les personnes qui porteront les decisions, la coordination et la livraison."
              : "The people carrying the decisions, coordination, and delivery work.",
          people,
          ...chrome,
        });
      }
      break;
    }

    case "partners": {
      appendElement(spec, pageKey, `${pageKey}-partners`, "LogoCloudSection", {
        title: section.title ?? copy.ecosystem,
        eyebrow: section.eyebrow ?? copy.servicesLabel,
        intro:
          lang === "fr"
            ? "Un apercu des alignements fabricants et partenaires qui soutiennent la solution."
            : "A view of the manufacturer and partner alignment supporting the solution.",
        logos: buildPartnerLabels(data, lang),
        ...chrome,
      });
      break;
    }

    case "commercial": {
      const blocks = buildCommercialBlocks(data, lang);
      for (const [index, block] of blocks.entries()) {
        appendElement(
          spec,
          pageKey,
          `${pageKey}-commercial-${index}`,
          "BulletListSection",
          {
            title: block.title,
            eyebrow: index === 0 ? section.eyebrow ?? copy.commercialTerms : undefined,
            items: block.items,
            tone: block.tone,
            ...chrome,
          },
        );
      }

      appendElement(spec, pageKey, `${pageKey}-contact`, "ContactStrip", {
        title: copy.nextStepsLabel,
        preparedFor: readPersonNames(data.preparedFor),
        preparedBy: readPersonNames(data.preparedBy),
        contactLines: buildContactLines(data, lang),
        ...chrome,
      });
      break;
    }
  }
}

export function buildQuoteDocumentSpec(
  data: Partial<QuoteData>,
  document: Omit<QuoteDocumentState, "spec">,
): Spec {
  const lang = getLang(data);
  const spec: MutableSpec = {
    root: "document-root",
    elements: {},
  };

  createElement(spec, spec.root, "ProposalDocument", {
    title: buildHeroTitle(data),
    quoteId: readString(data.quoteID),
    theme: document.theme,
    density: document.density,
    accent: document.accent,
    lang,
  });

  for (const section of document.sections) {
    if (section.enabled === false) continue;
    buildSectionPage(spec, data, document, section);
  }

  return spec;
}

export function buildQuoteDocumentState(
  data: Partial<QuoteData>,
  seed?: QuoteDocumentSeed,
): QuoteDocumentState {
  const lang = getLang(data);
  const normalized = {
    version: 1 as const,
    theme:
      seed?.theme && ["editorial", "executive", "technical"].includes(seed.theme)
        ? (seed.theme as QuoteDocumentTheme)
        : ("executive" as QuoteDocumentTheme),
    density:
      seed?.density && ["airy", "balanced", "compact"].includes(seed.density)
        ? (seed.density as QuoteDocumentDensity)
        : ("balanced" as QuoteDocumentDensity),
    accent:
      seed?.accent && ["sand", "forest", "ink"].includes(seed.accent)
        ? (seed.accent as QuoteDocumentAccent)
        : ("sand" as QuoteDocumentAccent),
    sections: normalizeSectionOrder(data, seed?.sections),
  };

  return {
    ...normalized,
    sections: normalized.sections.map((section) => ({
      ...section,
      title: section.title ?? getDefaultSectionTitle(section.kind, lang),
    })),
    spec: buildQuoteDocumentSpec(data, normalized),
  };
}

export function syncQuoteDocumentState(data: Partial<QuoteData>) {
  return buildQuoteDocumentState(data, data.document);
}

export function getDocumentSectionLabels(document: QuoteDocumentState) {
  return document.sections.map((section) => section.title ?? section.kind);
}

export function summarizeQuoteDocumentState(document: QuoteDocumentState) {
  return {
    theme: document.theme,
    density: document.density,
    accent: document.accent,
    pageCount: document.sections.length,
    sections: getDocumentSectionLabels(document),
  };
}

export function describeDocumentCatalog() {
  return {
    themes: quoteDocumentThemePresets,
    densities: quoteDocumentDensityPresets,
    accents: quoteDocumentAccentPresets,
    sections: quoteDocumentSectionCatalog,
    components: [
      "ProposalDocument",
      "ProposalPage",
      "HeroSection",
      "StatsGrid",
      "NarrativeSection",
      "ServiceCardsSection",
      "TotalsHighlight",
      "BulletListSection",
      "PeopleGridSection",
      "LogoCloudSection",
      "ContactStrip",
    ],
  };
}
