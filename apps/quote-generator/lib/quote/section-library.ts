import {
  getDocumentPlanSectionForLegacyFlag,
  isQuoteDocumentPlanSectionEnabled,
} from "./document/document-plan";

export const optionalSectionLibrary = [
  {
    key: "includeAboutUs",
    category: "story",
    title: "About Us",
    shortDescription:
      "A short company-introduction page that explains who Noxe is and how you work.",
    toneHint: "Useful when the client does not know the company well yet.",
    assistantQuestions: [
      "What should we highlight about Noxe in 2-3 short points?",
      "What differentiators matter most for this client?",
      "Should the tone feel corporate, technical, or more relationship-driven?",
    ],
    assistantPrompt:
      "Help me add an About Us section to this quote. Start from the saved Noxe profile and ask me only the minimum project-specific questions you still need about differentiators or tone.",
  },
  {
    key: "includeCulture",
    category: "story",
    title: "Culture",
    shortDescription:
      "A page about how the team works, collaborates, and approaches projects.",
    toneHint:
      "Good when trust, ways of working, or service culture matter in the sale.",
    assistantQuestions: [
      "What values or working principles should appear?",
      "What project behaviors matter most: rigor, speed, transparency, service?",
      "Should this section feel polished, human, or execution-focused?",
    ],
    assistantPrompt:
      "Help me add a Culture section to this quote. Start from the saved Noxe profile and ask only concise questions about the values, working style, and client-facing tone we want to tailor for this quote.",
  },
  {
    key: "includeCeoMessage",
    category: "story",
    title: "Leadership Note",
    shortDescription:
      "A founder or leadership message that frames the proposal at a high level.",
    toneHint:
      "Best when you want the PDF to feel more premium and relationship-led.",
    assistantQuestions: [
      "Who should this note be from?",
      "What is the main message we want the client to feel?",
      "What 2-3 values or commitments should the note reinforce?",
    ],
    assistantPrompt:
      "Help me add a leadership message to this quote. Start from the saved Noxe profile, then ask me only for the author, the core message, and the values or commitments we want to reinforce here.",
  },
  {
    key: "includeTeam",
    category: "credibility",
    title: "Team Presentation",
    shortDescription:
      "A page introducing the people behind the project and what each person brings.",
    toneHint:
      "Great when named experts, field experience, or local support help win confidence.",
    assistantQuestions: [
      "Who should appear on the team page?",
      "For each person, what role, skills, and one-sentence description should we show?",
      "Do you want a lean team page or a more detailed presentation?",
    ],
    assistantPrompt:
      "Help me add a Team Presentation section to this quote. Reuse any saved context you already have, then ask me only for the people to include, each person's role, key skills, and a short description.",
  },
  {
    key: "includePartners",
    category: "credibility",
    title: "Partners",
    shortDescription:
      "A page showing technology partners, manufacturers, or ecosystem credibility.",
    toneHint:
      "Useful when trusted brands or partner alignment help the proposal land better.",
    assistantQuestions: [
      "Which partner or manufacturer names should we show?",
      "Do you want logos only, or a short explanation of each partnership?",
      "Should this page emphasize technical compatibility, trust, or scale?",
    ],
    assistantPrompt:
      "Help me add a Partners section to this quote. Reuse any saved context you already have, then ask me which partners or manufacturers to highlight and what positioning we want for that page.",
  },
  {
    key: "includeTermsAndConditions",
    category: "commercial",
    title: "Terms and Conditions",
    shortDescription:
      "Commercial and legal terms that make the quote feel complete and ready to sign off.",
    toneHint:
      "Usually recommended unless the client wants a very lightweight first-pass proposal.",
    assistantQuestions: [
      "Do we want standard terms or client-specific wording?",
      "Are there special payment, schedule, warranty, or exclusion notes to mention?",
      "Should this page stay concise or include more detailed conditions?",
    ],
    assistantPrompt:
      "Help me review the Terms and Conditions section for this quote. Ask me only the questions you need about payment terms, warranty, schedule, or special conditions.",
  },
] as const;

export type OptionalSectionDefinition = (typeof optionalSectionLibrary)[number];
export type OptionalSectionCategory = OptionalSectionDefinition["category"];
export type OptionalSectionKey = OptionalSectionDefinition["key"];

export const optionalSectionCategoryLabels: Record<
  OptionalSectionCategory,
  string
> = {
  story: "Storytelling",
  credibility: "Credibility",
  commercial: "Commercial",
};

export function isOptionalSectionEnabled(
  quoteData: Record<string, unknown> | null | undefined,
  key: OptionalSectionKey,
) {
  if (typeof quoteData?.[key] === "boolean") {
    return Boolean(quoteData[key]);
  }

  const sectionKey = getDocumentPlanSectionForLegacyFlag(key);
  return sectionKey
    ? isQuoteDocumentPlanSectionEnabled(quoteData, sectionKey)
    : false;
}

export function getIncludedOptionalSections(
  quoteData: Record<string, unknown> | null | undefined,
) {
  return optionalSectionLibrary.filter((section) =>
    isOptionalSectionEnabled(quoteData, section.key),
  );
}
