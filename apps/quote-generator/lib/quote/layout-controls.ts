import {
  buildDocumentPlanSectionVisibilityPath,
  type LiveQuoteSectionVisibilityKey,
} from "@/lib/agent/document-section-visibility";
import { buildDocumentPlanPricingLayoutPath } from "@/lib/agent/document-layout-path";
import { buildQuoteDocumentPlan } from "@/lib/quote/document/document-plan";
import type { QuoteData } from "@/lib/quote/schema";

type QuoteLang = "fr" | "en";

type FixedPageRow = {
  key: "cover" | "toc";
  label: string;
  description: string;
  locked: true;
};

type ServiceRow = {
  key: string;
  index: number;
  label: string;
  description: string;
  removable: boolean;
  removePath: string;
};

type SectionRow = {
  key: LiveQuoteSectionVisibilityKey | "cover";
  label: string;
  description: string;
  enabled: boolean;
  locked: boolean;
  visibilityPath?: string;
  children: ServiceRow[];
};

export type QuoteStructureState = {
  lang: QuoteLang;
  pricingLayout: QuotePricingLayoutId;
  pricingLayoutPath: string;
  fixedPages: FixedPageRow[];
  sections: SectionRow[];
};

export const quotePricingLayoutOptions = [
  {
    id: "zero-ventilation",
    label: {
      fr: "Montant global",
      en: "Bottom line",
    },
    description: {
      fr: "Une vue compacte avec total global.",
      en: "A compact total-first view.",
    },
  },
  {
    id: "itemized-without-price",
    label: {
      fr: "Détail sans prix",
      en: "Detail no pricing",
    },
    description: {
      fr: "Détail technique sans prix unitaires.",
      en: "Technical detail without unit pricing.",
    },
  },
  {
    id: "itemized-with-price",
    label: {
      fr: "Détail complet",
      en: "Full detail",
    },
    description: {
      fr: "Qté, pièce, OEM, prix unitaire et total.",
      en: "Qty, part, OEM, unit price, and total.",
    },
  },
] as const;

export type QuotePricingLayoutId = (typeof quotePricingLayoutOptions)[number]["id"];

const sectionCopy: Record<
  QuoteLang,
  Record<
    SectionRow["key"] | FixedPageRow["key"],
    { label: string; description: string }
  >
> = {
  fr: {
    cover: {
      label: "Couverture",
      description: "Page d'ouverture du devis.",
    },
    toc: {
      label: "Table des matières",
      description: "Générée automatiquement.",
    },
    overview: {
      label: "Vue d'ensemble",
      description: "Contexte et description du projet.",
    },
    services: {
      label: "Services",
      description: "Sections techniques et tableaux de prix.",
    },
    about: {
      label: "À propos",
      description: "Présentation courte de Noxe.",
    },
    culture: {
      label: "Culture",
      description: "Façon de travailler et approche.",
    },
    leadership: {
      label: "Mot de direction",
      description: "Note de leadership ou message premium.",
    },
    team: {
      label: "Équipe",
      description: "Présentation des personnes clés.",
    },
    partners: {
      label: "Partenaires",
      description: "Manufacturiers et crédibilité écosystème.",
    },
    commercial: {
      label: "Cadre commercial",
      description: "Exclusions, modalités et notes.",
    },
    terms: {
      label: "Conditions",
      description: "Conditions générales et clôture.",
    },
  },
  en: {
    cover: {
      label: "Cover",
      description: "Opening page.",
    },
    toc: {
      label: "Table of contents",
      description: "Generated automatically.",
    },
    overview: {
      label: "Overview",
      description: "Project framing and summary.",
    },
    services: {
      label: "Services",
      description: "Technical sections and pricing tables.",
    },
    about: {
      label: "About",
      description: "Short Noxe introduction.",
    },
    culture: {
      label: "Culture",
      description: "Ways of working and approach.",
    },
    leadership: {
      label: "Leadership note",
      description: "Leadership or premium framing.",
    },
    team: {
      label: "Team",
      description: "Key people presentation.",
    },
    partners: {
      label: "Partners",
      description: "Manufacturers and ecosystem proof.",
    },
    commercial: {
      label: "Commercial",
      description: "Exclusions, payment, and notes.",
    },
    terms: {
      label: "Terms",
      description: "Final conditions and close-out.",
    },
  },
};

function readLang(value: unknown): QuoteLang {
  return typeof value === "string" && value.toLowerCase().startsWith("en")
    ? "en"
    : "fr";
}

function formatMoney(value: unknown, lang: QuoteLang) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildQuoteStructureState(
  quoteData: Record<string, unknown> | null | undefined,
): QuoteStructureState {
  const quote = (quoteData ?? {}) as Partial<QuoteData>;
  const lang = readLang(quote.lang);
  const plan = buildQuoteDocumentPlan(quote);
  const services = Array.isArray(quote.services) ? quote.services : [];

  const fixedPages: FixedPageRow[] = [
    { key: "cover", locked: true, ...sectionCopy[lang].cover },
    { key: "toc", locked: true, ...sectionCopy[lang].toc },
  ];

  const sections: SectionRow[] = plan.sectionSelections.map((section) => {
    const copy = sectionCopy[lang][section.key];
    const children: ServiceRow[] =
      section.key === "services"
        ? services.map((service, index) => {
            const total = formatMoney(service.totalCost, lang);
            return {
              key: `service-${index}`,
              index,
              label:
                typeof service.sectionName === "string" &&
                service.sectionName.trim().length > 0
                  ? service.sectionName.trim()
                  : `${lang === "fr" ? "Service" : "Service"} ${index + 1}`,
              description:
                total ??
                (lang === "fr"
                  ? "Section de service"
                  : "Service section"),
              removable: services.length > 1,
              removePath: `/services/${index}`,
            };
          })
        : [];

    return {
      key: section.key,
      label: copy.label,
      description:
        section.key === "services" && services.length > 0
          ? `${services.length} ${
              lang === "fr"
                ? services.length > 1
                  ? "sections"
                  : "section"
                : services.length > 1
                  ? "sections"
                  : "section"
            }`
          : copy.description,
      enabled: section.enabled,
      locked: section.key === "cover",
      visibilityPath:
        section.key === "cover"
          ? undefined
          : buildDocumentPlanSectionVisibilityPath(section.key),
      children,
    };
  });

  return {
    lang,
    pricingLayout:
      plan.serviceLayoutPolicy ?? quotePricingLayoutOptions[2].id,
    pricingLayoutPath: buildDocumentPlanPricingLayoutPath(),
    fixedPages,
    sections,
  };
}
