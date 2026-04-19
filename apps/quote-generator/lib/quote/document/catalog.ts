import { defineCatalog, type Spec } from "@json-render/core";
import { schema as reactSchema } from "@json-render/react/schema";
import { schema as reactPdfSchema } from "@json-render/react-pdf/server";
import { z } from "zod";

const statItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const narrativeParagraphSchema = z.string().min(1);

const serviceCardSchema = z.object({
  title: z.string().min(1),
  eyebrow: z.string().optional(),
  description: z.string().optional(),
  amount: z.string().optional(),
  meta: z.array(z.string().min(1)).default([]),
});

const bulletToneSchema = z.enum(["neutral", "warm", "warning"]);

const bulletSectionSchema = z.object({
  title: z.string().min(1),
  eyebrow: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
  tone: bulletToneSchema.default("neutral"),
});

const personCardSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string().min(1)).default([]),
});

const logoLabelSchema = z.string().min(1);

export const quoteDocumentThemeSchema = z.enum([
  "editorial",
  "executive",
  "technical",
]);

export const quoteDocumentDensitySchema = z.enum([
  "airy",
  "balanced",
  "compact",
]);

export const quoteDocumentAccentSchema = z.enum([
  "sand",
  "forest",
  "ink",
]);

const internalChromePropsSchema = z.object({
  density: quoteDocumentDensitySchema,
  accent: quoteDocumentAccentSchema,
  lang: z.enum(["fr", "en"]),
});

export const quoteDocumentSectionKindSchema = z.enum([
  "cover",
  "overview",
  "services",
  "about",
  "culture",
  "leadership",
  "team",
  "partners",
  "commercial",
]);

export const quoteDocumentSectionSchema = z.object({
  id: z.string().min(1),
  kind: quoteDocumentSectionKindSchema,
  title: z.string().optional(),
  eyebrow: z.string().optional(),
  enabled: z.boolean().default(true),
  variant: z
    .enum(["default", "immersive", "compact", "grid"])
    .default("default"),
});

export type QuoteDocumentTheme = z.infer<typeof quoteDocumentThemeSchema>;
export type QuoteDocumentDensity = z.infer<typeof quoteDocumentDensitySchema>;
export type QuoteDocumentAccent = z.infer<typeof quoteDocumentAccentSchema>;
export type QuoteDocumentSectionKind = z.infer<
  typeof quoteDocumentSectionKindSchema
>;
export type QuoteDocumentSection = z.infer<typeof quoteDocumentSectionSchema>;

export const quoteDocumentThemePresets: Array<{
  id: QuoteDocumentTheme;
  label: string;
  description: string;
}> = [
  {
    id: "editorial",
    label: "Editorial",
    description:
      "Layered storytelling, big opening moments, and softer commercial framing.",
  },
  {
    id: "executive",
    label: "Executive",
    description:
      "Balanced proposal pacing with clear proof points and client-facing polish.",
  },
  {
    id: "technical",
    label: "Technical",
    description:
      "Sharper system language, denser scope cards, and more operational emphasis.",
  },
];

export const quoteDocumentDensityPresets: Array<{
  id: QuoteDocumentDensity;
  label: string;
  description: string;
}> = [
  {
    id: "airy",
    label: "Airy",
    description: "More whitespace, slower pacing, and larger hero moments.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "A comfortable default for most proposals.",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Tighter cards and denser commercial detail per page.",
  },
];

export const quoteDocumentAccentPresets: Array<{
  id: QuoteDocumentAccent;
  label: string;
  description: string;
}> = [
  {
    id: "sand",
    label: "Sand",
    description: "Warm neutrals and sale-friendly contrast.",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Calmer, credibility-led accents for trust-heavy proposals.",
  },
  {
    id: "ink",
    label: "Ink",
    description: "Dark, precise accents for technical or premium scopes.",
  },
];

export const quoteDocumentSectionCatalog: Array<{
  kind: QuoteDocumentSectionKind;
  label: string;
  description: string;
  optional: boolean;
}> = [
  {
    kind: "cover",
    label: "Cover",
    description: "Front-page hero with client context, title, and positioning.",
    optional: false,
  },
  {
    kind: "overview",
    label: "Overview",
    description:
      "Narrative summary, key proposal stats, and the high-level commercial frame.",
    optional: false,
  },
  {
    kind: "services",
    label: "Services",
    description:
      "Client-facing breakdown of the scope, section by section, with totals and signal density.",
    optional: false,
  },
  {
    kind: "about",
    label: "About",
    description: "Company-introduction page for trust and positioning.",
    optional: true,
  },
  {
    kind: "culture",
    label: "Culture",
    description: "Ways of working, values, and project behaviors.",
    optional: true,
  },
  {
    kind: "leadership",
    label: "Leadership",
    description: "Founder or leadership note that frames the proposal.",
    optional: true,
  },
  {
    kind: "team",
    label: "Team",
    description: "Named delivery team or prepared-by experts.",
    optional: true,
  },
  {
    kind: "partners",
    label: "Partners",
    description: "Technology, manufacturer, or ecosystem credibility page.",
    optional: true,
  },
  {
    kind: "commercial",
    label: "Commercial",
    description:
      "Exclusions, payment terms, conditions, notes, and final contact block.",
    optional: false,
  },
];

export const quoteDocumentCatalogData = {
  components: {
    ProposalDocument: {
      props: z.object({
        title: z.string().min(1),
        quoteId: z.string().optional(),
        theme: quoteDocumentThemeSchema,
        density: quoteDocumentDensitySchema,
        accent: quoteDocumentAccentSchema,
        lang: z.enum(["fr", "en"]),
      }),
      slots: ["default"],
      description:
        "Root container for a proposal. It wraps page elements and carries global presentation settings.",
      example: {
        title: "Modernisation de systemes de controle",
        theme: "executive",
        density: "balanced",
        accent: "sand",
        lang: "fr",
      },
    },
    ProposalPage: {
      props: z
        .object({
          label: z.string().min(1),
          eyebrow: z.string().optional(),
          tone: z
            .enum(["cover", "story", "scope", "commercial"])
            .default("scope"),
        })
        .merge(internalChromePropsSchema),
      slots: ["default"],
      description:
        "Single proposal page. Use it to group a few high-signal sections into a coherent PDF page.",
      example: {
        label: "Overview",
        tone: "scope",
      },
    },
    HeroSection: {
      props: z
        .object({
          eyebrow: z.string().optional(),
          title: z.string().min(1),
          subtitle: z.string().optional(),
          summary: z.string().optional(),
          badge: z.string().optional(),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "Large opening block with an eyebrow, title, commercial subtitle, and a concise summary.",
      example: {
        eyebrow: "Proposal",
        title: "Fire alarm and controls refresh",
        subtitle: "Prepared for XYZ client",
      },
    },
    StatsGrid: {
      props: z
        .object({
          title: z.string().optional(),
          items: z.array(statItemSchema).min(1),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "Compact metrics row for customer, total value, number of sections, or commercial checkpoints.",
      example: {
        title: "Proposal snapshot",
        items: [
          { label: "Client", value: "Acme" },
          { label: "Total", value: "$18,400" },
        ],
      },
    },
    NarrativeSection: {
      props: z
        .object({
          title: z.string().min(1),
          eyebrow: z.string().optional(),
          paragraphs: z.array(narrativeParagraphSchema).min(1),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "Short editorial narrative block for summaries, company story, or positioning copy.",
      example: {
        title: "Project intent",
        paragraphs: ["Modernize field devices while keeping disruption low."],
      },
    },
    ServiceCardsSection: {
      props: z
        .object({
          title: z.string().min(1),
          eyebrow: z.string().optional(),
          intro: z.string().optional(),
          items: z.array(serviceCardSchema).min(1),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "Grid of service cards for the proposal scope. Each card can carry totals and supporting metadata.",
      example: {
        title: "Scope structure",
        items: [
          {
            title: "Control upgrades",
            description: "Replace outdated field devices and panel interfaces.",
            amount: "$12,200",
            meta: ["8 BOM items", "2 labor categories"],
          },
        ],
      },
    },
    TotalsHighlight: {
      props: z
        .object({
          title: z.string().min(1),
          amount: z.string().min(1),
          caption: z.string().optional(),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "High-contrast total card for subtotal or total project cost figures.",
      example: {
        title: "Projected total",
        amount: "$25,000",
      },
    },
    BulletListSection: {
      props: bulletSectionSchema.merge(internalChromePropsSchema),
      slots: [],
      description:
        "Bullet list for exclusions, payment terms, delivery principles, or commercial conditions.",
      example: {
        title: "Payment terms",
        items: ["40% on signature", "50% on material delivery", "10% on completion"],
      },
    },
    PeopleGridSection: {
      props: z
        .object({
          title: z.string().min(1),
          eyebrow: z.string().optional(),
          intro: z.string().optional(),
          people: z.array(personCardSchema).min(1),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "People cards for the delivery team or named specialists supporting the proposal.",
      example: {
        title: "Project team",
        people: [
          {
            name: "Jane Doe",
            role: "Project lead",
            bio: "Coordinates design and field delivery.",
          },
        ],
      },
    },
    LogoCloudSection: {
      props: z
        .object({
          title: z.string().min(1),
          eyebrow: z.string().optional(),
          intro: z.string().optional(),
          logos: z.array(logoLabelSchema).min(1),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "Simple logo cloud or partner-name field for ecosystem credibility and manufacturer alignment.",
      example: {
        title: "Selected ecosystem",
        logos: ["Partner A", "Partner B", "Partner C"],
      },
    },
    ContactStrip: {
      props: z
        .object({
          title: z.string().min(1),
          preparedFor: z.array(z.string().min(1)).default([]),
          preparedBy: z.array(z.string().min(1)).default([]),
          contactLines: z.array(z.string().min(1)).default([]),
        })
        .merge(internalChromePropsSchema),
      slots: [],
      description:
        "Closing contact strip summarizing who the proposal is for, who prepared it, and how to respond.",
      example: {
        title: "Next steps",
        preparedFor: ["Alice Client"],
        preparedBy: ["Bob Seller"],
        contactLines: ["bob@example.com", "+1 555 0101"],
      },
    },
  },
  actions: {},
};

export const quoteDocumentCatalog = defineCatalog(
  reactSchema,
  quoteDocumentCatalogData,
);

export const quoteDocumentPdfCatalog = defineCatalog(
  reactPdfSchema,
  {
    components: quoteDocumentCatalogData.components,
  },
);

export function isQuoteDocumentSpec(value: unknown): value is Spec {
  return quoteDocumentCatalog.validate(value).success;
}

export const quoteDocumentStateSchema = z.object({
  version: z.literal(1).default(1),
  theme: quoteDocumentThemeSchema.default("executive"),
  density: quoteDocumentDensitySchema.default("balanced"),
  accent: quoteDocumentAccentSchema.default("sand"),
  sections: z.array(quoteDocumentSectionSchema).min(1),
  spec: z.custom<Spec>(isQuoteDocumentSpec, {
    message: "Invalid quote document spec",
  }),
});

export type QuoteDocumentState = z.infer<typeof quoteDocumentStateSchema>;
