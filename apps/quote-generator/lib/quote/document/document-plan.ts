import type { QuoteData } from "../schema";
import {
  type QuoteDocumentPlan,
  type QuoteDocumentPlanArchetype,
  type QuoteDocumentPlanCommercialPreset,
  type QuoteDocumentPlanDetailLevel,
  type QuoteDocumentPlanPreset,
  type QuoteDocumentPlanSectionKey,
  type QuoteDocumentPlanSectionSelection,
  type QuoteDocumentPlanServiceLayout,
  type QuoteDocumentSection,
} from "./catalog";

type QuoteRecord = Partial<QuoteData> & Record<string, unknown>;
type QuoteRecordLike = Record<string, unknown> | null | undefined;
type QuoteDocumentPlanSeed = Partial<QuoteDocumentPlan> | null | undefined;

type QuoteDocumentPlanRecipeSectionKey =
  | "includeAboutUs"
  | "includeCulture"
  | "includeCeoMessage"
  | "includeTeam"
  | "includePartners"
  | "includeTermsAndConditions";

type QuoteDocumentPlanRecipeSectionVariant =
  | "default"
  | "immersive"
  | "compact"
  | "grid";

type QuoteDocumentPlanRecipeSection = {
  key: QuoteDocumentPlanRecipeSectionKey;
  enabled: boolean;
  variant: QuoteDocumentPlanRecipeSectionVariant;
};

type QuoteDocumentPlanState = QuoteDocumentPlan & {
  locked: true;
  enabledSections: QuoteDocumentPlanSectionKey[];
  serviceLayout: QuoteDocumentPlanServiceLayout;
  sections: QuoteDocumentPlanRecipeSection[];
};

const OPTIONAL_SECTION_FIELDS: Record<
  Exclude<QuoteDocumentPlanSectionKey, "cover" | "overview" | "services" | "commercial" | "terms">,
  keyof QuoteData
> = {
  about: "includeAboutUs",
  culture: "includeCulture",
  leadership: "includeCeoMessage",
  team: "includeTeam",
  partners: "includePartners",
};

const RECIPE_SECTION_ORDER: QuoteDocumentPlanRecipeSectionKey[] = [
  "includeAboutUs",
  "includeCulture",
  "includeCeoMessage",
  "includeTeam",
  "includePartners",
  "includeTermsAndConditions",
];

const RECIPE_SECTION_TO_PLAN_KEY: Record<
  QuoteDocumentPlanRecipeSectionKey,
  QuoteDocumentPlanSectionKey
> = {
  includeAboutUs: "about",
  includeCulture: "culture",
  includeCeoMessage: "leadership",
  includeTeam: "team",
  includePartners: "partners",
  includeTermsAndConditions: "terms",
};

const PLAN_KEY_TO_RECIPE_SECTION = Object.fromEntries(
  Object.entries(RECIPE_SECTION_TO_PLAN_KEY).map(([recipeKey, planKey]) => [
    planKey,
    recipeKey,
  ]),
) as Partial<Record<QuoteDocumentPlanSectionKey, QuoteDocumentPlanRecipeSectionKey>>;

const PLAN_SECTION_ORDER: QuoteDocumentPlanSectionKey[] = [
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
];

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

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
}

function isArchetype(value: unknown): value is QuoteDocumentPlanArchetype {
  return value === "project-proposal" || value === "service-agreement";
}

function isPreset(value: unknown): value is QuoteDocumentPlanPreset {
  return (
    value === "essentielle" ||
    value === "confiance" ||
    value === "technique" ||
    value === "service"
  );
}

function isDetailLevel(value: unknown): value is QuoteDocumentPlanDetailLevel {
  return value === "small" || value === "medium" || value === "large";
}

function isServiceLayout(
  value: unknown,
): value is QuoteDocumentPlanServiceLayout {
  return (
    value === "zero-ventilation" ||
    value === "itemized-without-price" ||
    value === "itemized-with-price"
  );
}

function isCommercialPreset(
  value: unknown,
): value is QuoteDocumentPlanCommercialPreset {
  return (
    value === "signature-progress" ||
    value === "signature-advancement" ||
    value === "service-billing" ||
    value === "custom"
  );
}

function isSectionKey(value: unknown): value is QuoteDocumentPlanSectionKey {
  return PLAN_SECTION_ORDER.includes(value as QuoteDocumentPlanSectionKey);
}

function isRecipeSectionKey(
  value: unknown,
): value is QuoteDocumentPlanRecipeSectionKey {
  return RECIPE_SECTION_ORDER.includes(
    value as QuoteDocumentPlanRecipeSectionKey,
  );
}

function isRecipeSectionVariant(value: unknown) {
  return (
    value === "default" ||
    value === "immersive" ||
    value === "compact" ||
    value === "grid"
  );
}

function mapRecipeVariantToDetailLevel(
  variant: QuoteDocumentPlanRecipeSectionVariant | undefined,
  fallback: QuoteDocumentPlanDetailLevel,
): QuoteDocumentPlanDetailLevel {
  if (variant === "compact") {
    return "small";
  }

  if (variant === "immersive") {
    return "large";
  }

  if (variant === "default" || variant === "grid") {
    return "medium";
  }

  return fallback;
}

function mapDetailLevelToLegacyVariant(
  detailLevel: QuoteDocumentPlanDetailLevel,
): QuoteDocumentPlanRecipeSectionVariant {
  switch (detailLevel) {
    case "small":
      return "compact";
    case "large":
      return "immersive";
    case "medium":
    default:
      return "default";
  }
}

function readExistingPlan(data: QuoteRecordLike): QuoteDocumentPlanSeed {
  const record = readRecord(data);
  if (!record) {
    return undefined;
  }

  const explicitPlan = readRecord(record.documentPlan);
  if (explicitPlan) {
    return explicitPlan as QuoteDocumentPlanSeed;
  }

  const composition = readRecord(record.composition);
  if (composition) {
    return composition as QuoteDocumentPlanSeed;
  }

  const document = readRecord(record.document);
  const nestedPlan = readRecord(document?.documentPlan);
  if (nestedPlan) {
    return nestedPlan as QuoteDocumentPlanSeed;
  }

  return undefined;
}

function readRecipeSectionSeeds(seed: QuoteDocumentPlanSeed) {
  const record = readRecord(seed);
  if (!record || !Array.isArray(record.sections)) {
    return new Map<
      QuoteDocumentPlanRecipeSectionKey,
      QuoteDocumentPlanRecipeSection
    >();
  }

  const entries = record.sections
    .map((section) => {
      const sectionRecord = readRecord(section);
      if (!sectionRecord) {
        return null;
      }

      const key = readString(sectionRecord.key) ?? readString(sectionRecord.kind);
      if (!isRecipeSectionKey(key)) {
        return null;
      }

      return [
        key,
        {
          key,
          enabled: sectionRecord.enabled !== false,
          variant: isRecipeSectionVariant(sectionRecord.variant)
            ? (sectionRecord.variant as QuoteDocumentPlanRecipeSectionVariant)
            : "default",
        },
      ] as const;
    })
    .filter(
      (
        item,
      ): item is readonly [
        QuoteDocumentPlanRecipeSectionKey,
        QuoteDocumentPlanRecipeSection,
      ] => item !== null,
    );

  return new Map(entries);
}

function inferArchetype(
  data: QuoteRecord,
  seed?: QuoteDocumentPlanSeed,
): QuoteDocumentPlanArchetype {
  if (isArchetype(seed?.archetype)) {
    return seed.archetype;
  }

  const blob = [
    readString(data.documentType),
    readString(data.documentTitle),
    readString(data.projectTitle),
  ]
    .filter((item): item is string => Boolean(item))
    .join(" ")
    .toLowerCase();

  if (/(service|entente|contrat|maintenance|msa|psa|support)/i.test(blob)) {
    return "service-agreement";
  }

  return "project-proposal";
}

function inferDetailLevel(
  data: QuoteRecord,
  seed?: QuoteDocumentPlanSeed,
): QuoteDocumentPlanDetailLevel {
  if (isDetailLevel(seed?.detailLevel)) {
    return seed.detailLevel;
  }

  const document = readRecord(data.document);
  const density = readString(document?.density);
  if (density === "airy") {
    return "small";
  }
  if (density === "compact") {
    return "large";
  }

  return "medium";
}

function inferServiceLayout(
  data: QuoteRecord,
  seed?: QuoteDocumentPlanSeed,
): QuoteDocumentPlanServiceLayout {
  if (isServiceLayout(seed?.serviceLayoutPolicy)) {
    return seed.serviceLayoutPolicy;
  }

  const serviceLayouts = Array.isArray(data.services)
    ? data.services
        .map((service) =>
          service && typeof service === "object"
            ? readString((service as { layout?: unknown }).layout)
            : undefined,
        )
        .filter(isServiceLayout)
    : [];

  if (serviceLayouts.length === 0) {
    return "itemized-with-price";
  }

  const counts = new Map<QuoteDocumentPlanServiceLayout, number>();
  for (const layout of serviceLayouts) {
    counts.set(layout, (counts.get(layout) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "itemized-with-price";
}

function inferCommercialPreset(
  data: QuoteRecord,
  archetype: QuoteDocumentPlanArchetype,
  seed?: QuoteDocumentPlanSeed,
): QuoteDocumentPlanCommercialPreset {
  if (isCommercialPreset(seed?.commercialPreset)) {
    return seed.commercialPreset;
  }

  const paymentBlob = readStringArray(data.paymentTerms)
    .join(" ")
    .replace(/\s+/g, "")
    .toLowerCase();

  if (
    paymentBlob.includes("35%") &&
    paymentBlob.includes("15%") &&
    paymentBlob.includes("40%")
  ) {
    return "signature-progress";
  }

  if (paymentBlob.includes("35%") && paymentBlob.includes("65%")) {
    return "signature-advancement";
  }

  if (archetype === "service-agreement") {
    return "service-billing";
  }

  return "custom";
}

function inferPreset(
  enabledSections: Set<QuoteDocumentPlanSectionKey>,
  archetype: QuoteDocumentPlanArchetype,
  seed?: QuoteDocumentPlanSeed,
): QuoteDocumentPlanPreset {
  if (isPreset(seed?.preset)) {
    return seed.preset;
  }

  if (archetype === "service-agreement") {
    return "service";
  }

  const hasAbout = enabledSections.has("about");
  const hasLeadership = enabledSections.has("leadership");
  const hasTeam = enabledSections.has("team");
  const hasPartners = enabledSections.has("partners");

  if (hasTeam) {
    return "technique";
  }

  if (hasAbout || hasLeadership || hasPartners) {
    return "confiance";
  }

  return "essentielle";
}

function mapLegacySectionKindToPlanKey(
  kind: QuoteDocumentSection["kind"],
): QuoteDocumentPlanSectionKey | null {
  switch (kind) {
    case "cover":
    case "overview":
    case "services":
    case "about":
    case "culture":
    case "leadership":
    case "team":
    case "partners":
    case "commercial":
      return kind;
    default:
      return null;
  }
}

function normalizeSeedSectionSelections(
  seed: QuoteDocumentPlanSeed,
): Partial<Record<QuoteDocumentPlanSectionKey, QuoteDocumentPlanSectionSelection>> {
  if (!Array.isArray(seed?.sectionSelections)) {
    return {};
  }

  return seed.sectionSelections.reduce<
    Partial<Record<QuoteDocumentPlanSectionKey, QuoteDocumentPlanSectionSelection>>
  >((acc, selection) => {
    if (!selection || typeof selection !== "object") {
      return acc;
    }

    const key = isSectionKey((selection as { key?: unknown }).key)
      ? (selection as { key: QuoteDocumentPlanSectionKey }).key
      : null;

    if (!key) {
      return acc;
    }

    const variant = isDetailLevel(
      (selection as { variant?: unknown }).variant,
    )
      ? (selection as { variant: QuoteDocumentPlanDetailLevel }).variant
      : "medium";

    acc[key] = {
      key,
      enabled:
        typeof (selection as { enabled?: unknown }).enabled === "boolean"
          ? Boolean((selection as { enabled: boolean }).enabled)
          : true,
      variant,
    };
    return acc;
  }, {});
}

function resolveSectionSelections(
  data: QuoteRecord,
  detailLevel: QuoteDocumentPlanDetailLevel,
  seed?: QuoteDocumentPlanSeed,
) {
  const seedRecord = readRecord(seed ?? null);
  const hasRecipeSectionSeed = Boolean(
    seedRecord && Array.isArray(seedRecord.sections),
  );
  const recipeSectionSeeds = readRecipeSectionSeeds(seed ?? null);
  const document = readRecord(data.document);
  const legacySections = Array.isArray(document?.sections)
    ? (document.sections as QuoteDocumentSection[])
    : [];
  const sectionsByKey = legacySections.reduce<
    Partial<Record<QuoteDocumentPlanSectionKey, QuoteDocumentSection>>
  >((acc, section) => {
    if (!section || typeof section !== "object") {
      return acc;
    }

    const key = mapLegacySectionKindToPlanKey(section.kind);
    if (key) {
      acc[key] = section;
    }
    return acc;
  }, {});
  const seedSelections = normalizeSeedSectionSelections(seed);

  return PLAN_SECTION_ORDER.map((key) => {
    const legacySection = sectionsByKey[key];
    const seeded = seedSelections[key];
    const recipeSeed = PLAN_KEY_TO_RECIPE_SECTION[key]
      ? recipeSectionSeeds.get(PLAN_KEY_TO_RECIPE_SECTION[key])
      : undefined;

    let enabled = seeded?.enabled ?? recipeSeed?.enabled ?? true;
    if (key === "cover") {
      enabled = true;
    } else if (key === "terms") {
      enabled =
        seeded?.enabled ??
        (hasRecipeSectionSeed
          ? recipeSeed?.enabled ?? false
          : Boolean(data.includeTermsAndConditions ?? true));
    } else {
      const field =
        OPTIONAL_SECTION_FIELDS[
          key as keyof typeof OPTIONAL_SECTION_FIELDS
        ];
      if (field) {
        enabled =
          seeded?.enabled ??
          (hasRecipeSectionSeed
            ? recipeSeed?.enabled ?? false
            : legacySection?.enabled ?? Boolean(data[field]));
      } else {
        enabled = seeded?.enabled ?? legacySection?.enabled ?? true;
      }
    }

    const variant =
      seeded?.variant ??
      (recipeSeed
        ? mapRecipeVariantToDetailLevel(recipeSeed.variant, detailLevel)
        : undefined) ??
      mapRecipeVariantToDetailLevel(legacySection?.variant, detailLevel);

    return {
      key,
      enabled,
      variant,
    } satisfies QuoteDocumentPlanSectionSelection;
  });
}

function resolveRecipeSections(
  sectionSelections: QuoteDocumentPlanSectionSelection[],
  seed?: QuoteDocumentPlanSeed,
) {
  const recipeSectionSeeds = readRecipeSectionSeeds(seed ?? null);

  return RECIPE_SECTION_ORDER.map((key) => {
    const planKey = RECIPE_SECTION_TO_PLAN_KEY[key];
    const selection = sectionSelections.find((section) => section.key === planKey);
    const seeded = recipeSectionSeeds.get(key);

    return {
      key,
      enabled: Boolean(selection?.enabled),
      variant:
        seeded?.variant ??
        mapDetailLevelToLegacyVariant(selection?.variant ?? "medium"),
    } satisfies QuoteDocumentPlanRecipeSection;
  });
}

export function buildQuoteDocumentPlan(
  data: QuoteRecordLike,
  seed?: QuoteDocumentPlanSeed,
): QuoteDocumentPlanState {
  const record = (readRecord(data) ?? {}) as QuoteRecord;
  const normalizedSeed = readRecord(seed) as QuoteDocumentPlanSeed;
  const next = normalizedSeed
    ? ({
        ...record,
        composition: normalizedSeed,
        documentPlan: normalizedSeed,
      } as QuoteRecord)
    : record;

  const planSeed = readExistingPlan(next);
  const archetype = inferArchetype(next, planSeed);
  const detailLevel = inferDetailLevel(next, planSeed);
  const serviceLayoutPolicy = inferServiceLayout(next, planSeed);
  const sectionSelections = resolveSectionSelections(next, detailLevel, planSeed);
  const sections = resolveRecipeSections(sectionSelections, planSeed);
  const enabledSections = new Set(
    sectionSelections
      .filter((section) => section.enabled)
      .map((section) => section.key),
  );

  return {
    version: 1,
    locked: true,
    archetype,
    preset: inferPreset(enabledSections, archetype, planSeed),
    detailLevel,
    serviceLayoutPolicy,
    serviceLayout: serviceLayoutPolicy,
    commercialPreset: inferCommercialPreset(next, archetype, planSeed),
    enabledSections: [...enabledSections],
    sectionSelections,
    sections,
  };
}

export function syncQuoteDocumentPlan(data: QuoteRecordLike) {
  return buildQuoteDocumentPlan(data);
}

export function buildQuoteDocumentComposition(
  plan: QuoteDocumentPlanState,
): QuoteDocumentPlanState {
  return {
    ...plan,
    serviceLayout: plan.serviceLayout ?? plan.serviceLayoutPolicy,
    serviceLayoutPolicy: plan.serviceLayoutPolicy,
    enabledSections: plan.enabledSections,
    sectionSelections: plan.sectionSelections.map((section) => ({
      key: section.key,
      enabled: section.enabled,
      variant: section.variant,
    })),
    sections: plan.sections.map((section) => ({
      key: section.key,
      enabled: section.enabled,
      variant: section.variant,
    })),
  };
}

export function syncLegacySectionFlagsFromDocumentPlan(
  target: QuoteRecordLike,
  plan: QuoteDocumentPlanState,
) {
  const record = readRecord(target);
  if (!record) {
    return;
  }

  for (const [sectionKey, quoteField] of Object.entries(
    OPTIONAL_SECTION_FIELDS,
  ) as Array<[keyof typeof OPTIONAL_SECTION_FIELDS, keyof QuoteData]>) {
    const recipeKey = PLAN_KEY_TO_RECIPE_SECTION[sectionKey];
    record[quoteField] = Boolean(
      plan.sectionSelections.find((section) => section.key === sectionKey)
        ?.enabled ??
        (recipeKey
          ? plan.sections.find((section) => section.key === recipeKey)?.enabled
          : undefined),
    );
  }

  record.includeTermsAndConditions = Boolean(
    plan.sectionSelections.find((section) => section.key === "terms")?.enabled ??
      plan.sections.find(
        (section) => section.key === "includeTermsAndConditions",
      )?.enabled ??
      true,
  );
}

export function getLegacyFlagForDocumentPlanSection(
  sectionKey: QuoteDocumentPlanSectionKey,
) {
  return PLAN_KEY_TO_RECIPE_SECTION[sectionKey];
}

export function getDocumentPlanSectionForLegacyFlag(legacyFlag: string) {
  return RECIPE_SECTION_TO_PLAN_KEY[
    legacyFlag as QuoteDocumentPlanRecipeSectionKey
  ];
}

export function isQuoteDocumentPlanSectionEnabled(
  quoteData: Record<string, unknown> | null | undefined,
  sectionKey: QuoteDocumentPlanSectionKey,
) {
  const data = (quoteData ?? {}) as QuoteRecord;
  const hasCompositionSeed = Boolean(readExistingPlan(data));

  if (!hasCompositionSeed) {
    const legacyFlag = getLegacyFlagForDocumentPlanSection(sectionKey);
    if (!legacyFlag) {
      return true;
    }

    return Boolean(data[legacyFlag as keyof QuoteData]);
  }

  return buildQuoteDocumentPlan(data).sectionSelections.some(
    (section) => section.key === sectionKey && section.enabled,
  );
}

export type QuoteRecipeId = QuoteDocumentPlanPreset;
export type QuoteServiceLayoutId = QuoteDocumentPlanServiceLayout;
export type QuoteRecipeDetailLevelId = QuoteDocumentPlanDetailLevel;
export type QuoteCommercialPresetId = QuoteDocumentPlanCommercialPreset;

export type QuoteRecipePreset = {
  id: QuoteRecipeId;
  title: string;
  shortTitle: string;
  description: string;
  bestWhen: string;
  enabledSections: QuoteDocumentPlanRecipeSectionKey[];
  serviceLayout: QuoteServiceLayoutId;
  assistantPrompt: string;
};

export type QuoteRecipeSectionMeta = {
  key: QuoteDocumentPlanRecipeSectionKey;
  family: "narratif" | "credibilite" | "commercial";
  title: string;
  shortDescription: string;
  toneHint: string;
  assistantQuestions: string[];
  assistantPrompt: string;
};

export const recipeSectionOrder = [...RECIPE_SECTION_ORDER];

export const quoteRecipeFamilyLabels: Record<
  QuoteRecipeSectionMeta["family"],
  string
> = {
  narratif: "Narratif",
  credibilite: "Credibilite",
  commercial: "Commercial",
};

export const quoteRecipeSectionMeta: Record<
  QuoteDocumentPlanRecipeSectionKey,
  QuoteRecipeSectionMeta
> = {
  includeAboutUs: {
    key: "includeAboutUs",
    family: "narratif",
    title: "Presentation de Noxe",
    shortDescription:
      "Situer rapidement qui est Noxe et pourquoi l'approche inspire confiance.",
    toneHint:
      "Utile quand le client connait peu Noxe ou quand le devis doit mieux se vendre seul.",
    assistantQuestions: [
      "Quels differentiatieurs de Noxe doivent ressortir ici ?",
      "Le ton doit-il etre plus institutionnel, plus technique ou plus relationnel ?",
      "Y a-t-il un angle client precis a mettre de l'avant ?",
    ],
    assistantPrompt:
      "Ajoutons une courte section de presentation de Noxe a ce devis. Reutilise le profil enregistre de Noxe, puis pose-moi seulement les questions vraiment necessaires pour adapter le positionnement a ce client.",
  },
  includeCulture: {
    key: "includeCulture",
    family: "narratif",
    title: "Facon de livrer",
    shortDescription:
      "Expliquer comment l'equipe travaille, coordonne et protege l'execution.",
    toneHint:
      "Pertinent quand la methode, la rigueur et la transparence sont des arguments de vente.",
    assistantQuestions: [
      "Quelles valeurs ou facons de faire doivent apparaitre ?",
      "Doit-on insister sur la rigueur, la vitesse, la coordination ou le service ?",
      "Souhaite-t-on une section plus humaine ou plus operationnelle ?",
    ],
    assistantPrompt:
      "Ajoutons une section sur la facon de livrer ce mandat. Pars du profil de Noxe, puis demande-moi seulement ce qu'il faut pour adapter les valeurs et le style a ce devis.",
  },
  includeCeoMessage: {
    key: "includeCeoMessage",
    family: "narratif",
    title: "Mot de direction",
    shortDescription:
      "Donner une ouverture plus premium et plus relationnelle a la proposition.",
    toneHint:
      "A privilegier quand le devis doit creer de la confiance des les premieres pages.",
    assistantQuestions: [
      "Qui porte ce message ?",
      "Quelle impression le client doit-il garder apres cette page ?",
      "Quelles promesses ou valeurs doivent etre renforcees ?",
    ],
    assistantPrompt:
      "Ajoutons un mot de direction a ce devis. Reutilise le ton premium deja valide pour Noxe, puis demande-moi seulement l'auteur, l'intention et les engagements a faire ressortir.",
  },
  includeTeam: {
    key: "includeTeam",
    family: "credibilite",
    title: "Equipe projet",
    shortDescription:
      "Montrer qui porte le mandat et quelles expertises soutiennent la livraison.",
    toneHint:
      "Tres utile quand la presence terrain, l'expertise ou le support local aident a gagner la confiance.",
    assistantQuestions: [
      "Qui doit apparaitre sur la page equipe ?",
      "Pour chaque personne, quel role et quelles forces doivent etre visibles ?",
      "Veut-on une presentation concise ou plus detaillee ?",
    ],
    assistantPrompt:
      "Ajoutons une page equipe a ce devis. Reutilise le contexte deja disponible, puis demande-moi seulement les noms, roles, expertises et courtes descriptions qui manquent.",
  },
  includePartners: {
    key: "includePartners",
    family: "credibilite",
    title: "Partenaires et fabricants",
    shortDescription:
      "Renforcer la credibilite avec les marques, fabricants ou partenaires cles.",
    toneHint:
      "Pertinent quand la compatibilite technique ou les marques reconnues aident a conclure.",
    assistantQuestions: [
      "Quelles marques ou quels partenaires doivent etre visibles ?",
      "Veut-on seulement les afficher ou aussi expliquer leur role ?",
      "Doit-on mettre l'accent sur la confiance, l'echelle ou la compatibilite ?",
    ],
    assistantPrompt:
      "Ajoutons une page partenaires et fabricants a ce devis. Reutilise les informations deja presentes, puis demande-moi seulement les noms et l'angle de positionnement a retenir.",
  },
  includeTermsAndConditions: {
    key: "includeTermsAndConditions",
    family: "commercial",
    title: "Conditions generales",
    shortDescription:
      "Completer le cadre commercial pour que le PDF soit reellement pret a envoyer.",
    toneHint:
      "Normalement recommande, sauf si l'on prepare volontairement une toute premiere ebauche tres legere.",
    assistantQuestions: [
      "Doit-on garder les conditions standard ou prevoir des ajustements client ?",
      "Y a-t-il des modalites, garanties ou contraintes particulieres a preciser ?",
      "Faut-il rester tres concis ou detailler davantage le cadre commercial ?",
    ],
    assistantPrompt:
      "Revisons les conditions generales de ce devis. Pose-moi uniquement les questions qui restent vraiment necessaires sur les modalites de paiement, garanties, echeancier ou conditions speciales.",
  },
};

export const quoteRecipePresets: QuoteRecipePreset[] = [
  {
    id: "essentielle",
    title: "Essentielle",
    shortTitle: "Essentielle",
    description:
      "Une proposition serree: portee, prix, exclusions, paiement et conditions.",
    bestWhen:
      "Le client connait deja Noxe et veut surtout une version claire, rapide et commerciale.",
    enabledSections: ["includeTermsAndConditions"],
    serviceLayout: "itemized-with-price",
    assistantPrompt:
      "Je veux une recette essentielle pour ce devis: structure serree, portee claire, prix visibles et cadre commercial complet. Ajuste le devis dans ce sens et pose-moi seulement les questions qui bloquent encore.",
  },
  {
    id: "confiance",
    title: "Confiance",
    shortTitle: "Confiance",
    description:
      "Renforce le recit, la credibilite de Noxe et la relation avant le detail technique.",
    bestWhen:
      "Le client connait peu Noxe ou le devis doit mieux vendre l'entreprise en plus de la portee.",
    enabledSections: [
      "includeAboutUs",
      "includeCeoMessage",
      "includePartners",
      "includeTermsAndConditions",
    ],
    serviceLayout: "itemized-without-price",
    assistantPrompt:
      "Je veux une recette orientee confiance pour ce devis. Mets l'accent sur le positionnement de Noxe, le mot de direction, les partenaires et un cadre commercial propre, puis pose-moi seulement les questions qui manquent.",
  },
  {
    id: "technique",
    title: "Technique",
    shortTitle: "Technique",
    description:
      "Une proposition plus credible cote execution, equipe et detail technique.",
    bestWhen:
      "Le client veut comprendre qui livre, avec quelles expertises et avec quel niveau de detail.",
    enabledSections: [
      "includeAboutUs",
      "includeTeam",
      "includePartners",
      "includeTermsAndConditions",
    ],
    serviceLayout: "itemized-with-price",
    assistantPrompt:
      "Je veux une recette technique pour ce devis. Oriente la structure vers la credibilite d'execution, l'equipe projet et un niveau de detail technique clair, puis demande-moi seulement ce qui manque.",
  },
  {
    id: "service",
    title: "Service / Gouvernance",
    shortTitle: "Service",
    description:
      "Une structure plus axee sur la methode, la continuite et la gouvernance du service.",
    bestWhen:
      "Le document ressemble davantage a une entente de service, un mandat recurrent ou une proposition d'accompagnement.",
    enabledSections: [
      "includeCulture",
      "includeTeam",
      "includeTermsAndConditions",
    ],
    serviceLayout: "itemized-without-price",
    assistantPrompt:
      "Je veux une recette service et gouvernance pour ce devis. Oriente la proposition vers la methode, la continuite, l'equipe et un cadre commercial propre, puis pose-moi seulement les questions utiles.",
  },
];

export const quoteServiceLayoutOptions = [
  {
    id: "zero-ventilation" as const,
    label: "Synthese",
    description: "Presentation plus condensee, sans detail ligne par ligne.",
  },
  {
    id: "itemized-without-price" as const,
    label: "Itemise sans prix",
    description: "Les lignes sont visibles, sans ventilation des prix.",
  },
  {
    id: "itemized-with-price" as const,
    label: "Itemise avec prix",
    description: "Le client voit les lignes detaillees et les prix.",
  },
];

export const quoteRecipeDetailLevelOptions = [
  {
    id: "small" as const,
    title: "Essentiel",
    description: "Version courte, directe et plus legere.",
  },
  {
    id: "medium" as const,
    title: "Standard",
    description: "Le bon equilibre entre vitesse de lecture et clarte.",
  },
  {
    id: "large" as const,
    title: "Tres detaille",
    description: "Plus de signal commercial et plus de contexte.",
  },
];

export const quoteCommercialPresetOptions = [
  {
    id: "signature-progress" as const,
    label: "35 / 15 / 40 / 10",
    description: "Cadence chantier progressive avec acompte a la signature.",
  },
  {
    id: "signature-advancement" as const,
    label: "35 / 65 selon avancement",
    description: "Acompte securise puis solde pilote par l'avancement.",
  },
  {
    id: "service-billing" as const,
    label: "Service / recurrents",
    description: "Cadre de facturation plus adapte a une entente de service.",
  },
  {
    id: "custom" as const,
    label: "Personnalise",
    description: "Cadre commercial a verrouiller ou deja negocie.",
  },
];

export function getEnabledRecipeSections(
  quoteData: Record<string, unknown> | null | undefined,
) {
  return buildQuoteDocumentPlan(quoteData).sections
    .filter((section) => section.enabled)
    .map((section) => section.key);
}

export function getMatchingQuoteRecipe(
  quoteData: Record<string, unknown> | null | undefined,
) {
  const plan = buildQuoteDocumentPlan(quoteData);
  return quoteRecipePresets.find((preset) => preset.id === plan.preset) ?? null;
}

export function getServiceLayoutSummary(
  quoteData: Record<string, unknown> | null | undefined,
) {
  const plan = buildQuoteDocumentPlan(quoteData);
  return (
    quoteServiceLayoutOptions.find(
      (option) => option.id === plan.serviceLayoutPolicy,
    ) ?? quoteServiceLayoutOptions[0]
  );
}

export function getRecipeSectionEntries(
  quoteData: Record<string, unknown> | null | undefined,
) {
  const enabledSections = new Set(getEnabledRecipeSections(quoteData));
  return recipeSectionOrder.map((key) => ({
    ...quoteRecipeSectionMeta[key],
    enabled: enabledSections.has(key),
  }));
}

export function summarizeQuoteRecipe(
  quoteData: Record<string, unknown> | null | undefined,
) {
  const plan = buildQuoteDocumentPlan(quoteData);
  return {
    activeRecipe: getMatchingQuoteRecipe(quoteData),
    sectionCount: getEnabledRecipeSections(quoteData).length,
    serviceLayout: getServiceLayoutSummary(quoteData),
    detailLevel:
      quoteRecipeDetailLevelOptions.find((item) => item.id === plan.detailLevel) ??
      quoteRecipeDetailLevelOptions[1],
    commercialPreset:
      quoteCommercialPresetOptions.find(
        (item) => item.id === plan.commercialPreset,
      ) ?? quoteCommercialPresetOptions[3],
  };
}
