import { assessQuoteProductionReadiness } from "./render-readiness";
import { getIncludedOptionalSections } from "./section-library";

export type WorkspacePromptSuggestion = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export type QuoteWorkspaceSummary = {
  customerLabel: string;
  preparedForNames: string[];
  preparedByNames: string[];
  contactName?: string;
  contactCompany?: string;
  totalProjectCost?: number;
  serviceCount: number;
  optionalSectionCount: number;
  readiness: ReturnType<typeof assessQuoteProductionReadiness>;
};

function asRecord(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readPersonNames(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = readString((item as { name?: unknown }).name);
      return name ?? null;
    })
    .filter((item): item is string => Boolean(item));
}

function hasMeaningfulStrings(value: unknown) {
  return (
    Array.isArray(value) &&
    value.some((item) => typeof item === "string" && item.trim().length > 0)
  );
}

export function summarizeQuoteWorkspace(
  quoteData: Record<string, unknown> | null | undefined,
): QuoteWorkspaceSummary {
  const record = asRecord(quoteData);
  const contactInfo = asRecord(
    record.contactInfo as Record<string, unknown> | undefined,
  );
  const projectSummary = asRecord(
    record.projectSummary as Record<string, unknown> | undefined,
  );

  const preparedForNames = readPersonNames(record.preparedFor);
  const preparedByNames = readPersonNames(record.preparedBy);
  const customerLabel =
    preparedForNames[0] ??
    readString(contactInfo.company) ??
    readString(record.clientName) ??
    "Client non confirmé";

  return {
    customerLabel,
    preparedForNames,
    preparedByNames,
    contactName: readString(contactInfo.name),
    contactCompany: readString(contactInfo.company),
    totalProjectCost: readNumber(projectSummary.totalProjectCost),
    serviceCount: Array.isArray(record.services) ? record.services.length : 0,
    optionalSectionCount: getIncludedOptionalSections(record).length,
    readiness: assessQuoteProductionReadiness(record),
  };
}

export function buildQuoteWorkspaceSuggestions({
  quoteData,
  pdfFileId,
}: {
  quoteData: Record<string, unknown> | null | undefined;
  pdfFileId: string | null;
}) {
  const record = asRecord(quoteData);
  const summary = summarizeQuoteWorkspace(record);
  const blockers = new Set(summary.readiness.blockers);
  const suggestions: WorkspacePromptSuggestion[] = [];

  const addSuggestion = (suggestion: WorkspacePromptSuggestion) => {
    if (suggestions.some((item) => item.id === suggestion.id)) {
      return;
    }

    suggestions.push(suggestion);
  };

  const hasContactBlocker = [...blockers].some(
    (path) =>
      path.startsWith("preparedFor") ||
      path.startsWith("preparedBy") ||
      path.startsWith("contactInfo"),
  );

  if (hasContactBlocker) {
    addSuggestion({
      id: "lock-contacts",
      label: "Valider les contacts",
      description:
        "Confirmer à qui s’adresse le devis, qui l’envoie et le bloc contact final.",
      prompt:
        "Validons les bases du devis en une seule passe. Pose-moi un lot de questions consolidé pour confirmer qui prépare ce devis, à qui il s’adresse et quelles informations de contact finales doivent apparaître dans le PDF.",
    });
  }

  if (!hasMeaningfulStrings(record.paymentTerms)) {
    addSuggestion({
      id: "payment-terms",
      label: "Proposer les paiements",
      description:
        "Préparer une structure commerciale solide qui sécurise un dépôt.",
      prompt:
        "Recommande des modalités de paiement prêtes à envoyer pour ce devis. Privilégie une structure qui sécurise un dépôt à la signature, explique la meilleure option pour ce projet, et ne me questionne que s’il manque une vraie décision d’affaires.",
    });
  }

  if (!hasMeaningfulStrings(record.exclusions)) {
    addSuggestion({
      id: "strict-exclusions",
      label: "Rédiger les exclusions",
      description:
        "Lister clairement tout ce qui est fourni, installé, coordonné ou payé par d’autres.",
      prompt:
        "Rédige une section d’exclusions stricte pour ce devis en t’appuyant sur le classeur, les pièces jointes et l’état actuel du devis. Sois explicite sur tout travail par d’autres, tout travail non spécifié et tout ce qui n’est pas inclus dans la portée de Noxe.",
    });
  }

  if (summary.optionalSectionCount === 0) {
    addSuggestion({
      id: "recommend-sections",
      label: "Recommander des sections",
      description:
        "Déterminer quelles sections optionnelles aideraient vraiment cette proposition.",
      prompt:
        "Recommande quelles sections optionnelles de type brochure devraient être incluses dans ce PDF de devis. Commence par les plus fortes pour cette proposition et pose-moi seulement le minimum de questions de suivi nécessaires.",
    });
  }

  if (summary.serviceCount === 0) {
    addSuggestion({
      id: "shape-services",
      label: "Structurer la portée",
      description:
        "Transformer le matériel importé en sections de service et en portée plus claires.",
      prompt:
        "Passe en revue le devis actuel et les fichiers de soutien, puis dis-moi comment structurer les sections de service pour une proposition client. Mets le devis à jour si la structure est claire; sinon pose-moi seulement les questions manquantes les plus importantes.",
    });
  }

  if (summary.readiness.renderReadiness === "ready") {
    addSuggestion({
      id: pdfFileId ? "refresh-pdf" : "generate-pdf",
      label: pdfFileId ? "Actualiser le PDF" : "Générer le PDF",
      description: pdfFileId
        ? "Regénérer un PDF avec les dernières données du devis."
        : "Générer le premier PDF prêt à envoyer pour ce devis.",
      prompt: pdfFileId
        ? "Le devis devrait être prêt à envoyer maintenant. Regénère le PDF avec les dernières données du devis, puis résume ce qui a changé."
        : "Le devis semble prêt à envoyer. Génère le PDF maintenant et résume ce que je devrais vérifier avant l’envoi.",
    });
  } else {
    addSuggestion({
      id: "blocking-issues",
      label: "Qu’est-ce qui bloque encore ?",
      description:
        "Obtenir une liste concise de ce qui manque encore avant la génération.",
      prompt:
        "À partir de l’état actuel du devis, dis-moi exactement ce qui bloque encore un PDF prêt à envoyer. Regroupe les sujets liés et pose-moi seulement les questions manquantes qui comptent vraiment.",
    });
  }

  return suggestions.slice(0, 4);
}
