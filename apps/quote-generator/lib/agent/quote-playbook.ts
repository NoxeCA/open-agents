export type QuotePlaybookArchetype = {
  key: "project-proposal" | "service-agreement";
  useWhen: string;
  sectionFlow: string[];
  companyStoryAngle: string[];
  commercialPriorities: string[];
};

export type QuotePlaybookExample = {
  name: string;
  useWhen: string;
  pattern: string[];
};

export type NoxeQuotePlaybook = {
  origin: string;
  globalRules: string[];
  tonePatterns: string[];
  valueFraming: string[];
  exclusionsChecklist: string[];
  paymentPatterns: Array<{
    name: string;
    useWhen: string;
    schedule: string[];
  }>;
  archetypes: QuotePlaybookArchetype[];
  examples: QuotePlaybookExample[];
};

export const noxeQuotePlaybook: NoxeQuotePlaybook = {
  origin:
    "Distilled from prior Noxe service agreements and proposal quotes supplied locally on 2026-04-18. Use these as style/commercial patterns, not as customer facts.",
  globalRules: [
    "Open with a short thank-you plus a one-sentence client outcome, then move quickly into scope or commercial framing.",
    "Match the source/customer language. Do not force French or English when the source clearly signals the opposite.",
    "Keep company-story sections short unless the document is specifically about governance, partnership, or corporate positioning.",
    "Separate scope, assumptions, exclusions, payment terms, and warranty/terms with clear headings.",
    "When documents are incomplete or no site visit occurred, add an explicit Assumptions or Hypotheses section instead of hiding uncertainty.",
  ],
  tonePatterns: [
    "Use a partner/advisor voice: technically credible, commercially direct, and operationally grounded.",
    "Prefer action-led phrasing such as implement, integrate, validate, commission, optimize, accompany, and simplify.",
    "Frame value in business terms: reduce OPEX, improve reliability, future-proof operations, minimize disruption, and support growth.",
    "Be firm on commercial language: NET30, 30-day validity, no deductions unless negotiated, and explicit scope boundaries.",
  ],
  valueFraming: [
    "Turnkey ownership with minimal client burden when Noxe covers supply, installation, commissioning, and handoff.",
    "Transparent assumptions when information is missing.",
    "Operational continuity, rapid response, and structured governance for service agreements.",
    "Outcome-oriented architecture and phased methodology for larger multi-site proposals.",
  ],
  exclusionsChecklist: [
    "Work not mentioned in the scope or description of work.",
    "Painting, patching, ragréage, conduit, and civil/electrical work unless explicitly included.",
    "Lifting equipment, ISP coordination, network hardware, racks, switches, or TI equipment unless explicitly included.",
    "Existing-condition repairs, non-functional field components, or rework discovered during deployment.",
    "After-hours work unless explicitly included.",
  ],
  paymentPatterns: [
    {
      name: "equipment-heavy staged billing",
      useWhen:
        "Use for hardware-heavy project proposals with material procurement risk and milestone delivery.",
      schedule: [
        "35 % à la signature",
        "15 % à la commande du matériel",
        "40 % en cours d'installation",
        "10 % à la fin des travaux",
      ],
    },
    {
      name: "simplified progress billing",
      useWhen:
        "Use for simpler execution, lower procurement exposure, or when milestone detail is unnecessary.",
      schedule: [
        "35 % à la signature",
        "65 % selon l'avancement des travaux",
      ],
    },
    {
      name: "service agreement recurring billing",
      useWhen:
        "Use for maintenance or service contracts with recurring value and review cadence.",
      schedule: [
        "Facturation mensuelle",
        "NET 30",
        "Révision annuelle au besoin",
      ],
    },
  ],
  archetypes: [
    {
      key: "project-proposal",
      useWhen:
        "Use for one-time projects, modernization mandates, migrations, equipment refreshes, and solution proposals.",
      sectionFlow: [
        "cover",
        "thank-you + project outcome",
        "short company framing",
        "project rationale or methodology",
        "pricing or scenario comparison",
        "assumptions if needed",
        "exclusions",
        "payment terms",
        "signatures",
        "warranty or appendix terms",
      ],
      companyStoryAngle: [
        "Noxe is a pragmatic partner that translates technical complexity into executable projects.",
        "Keep the bio concise and pivot quickly to the client's project, scope, and outcome.",
      ],
      commercialPriorities: [
        "Protect signature deposit and material cash flow.",
        "Be explicit about everything supplied or performed by others.",
      ],
    },
    {
      key: "service-agreement",
      useWhen:
        "Use for maintenance, SLA, MSA, PSA, governance, or recurring service relationships.",
      sectionFlow: [
        "cover",
        "relationship framing",
        "service model",
        "scope of included services",
        "scope of optional services",
        "SLA or response commitments",
        "rates or commercial model",
        "responsibilities",
        "payment and review cadence",
        "terms, confidentiality, signatures",
      ],
      companyStoryAngle: [
        "Noxe is an operationally disciplined fournisseur and long-term partner.",
        "Lean into governance clarity, responsiveness, and predictable service delivery.",
      ],
      commercialPriorities: [
        "Make cadence, responsibilities, and renewal logic explicit.",
        "Use recurring billing and review language when the document is contractual rather than project-specific.",
      ],
    },
  ],
  examples: [
    {
      name: "missing site visit",
      useWhen:
        "Use when the site has not been visited or critical field conditions remain unknown.",
      pattern: [
        "State that assumptions are being used to keep the proposal moving transparently.",
        "List only the highest-impact assumptions that affect labor, access, or material scope.",
      ],
    },
    {
      name: "turnkey summary",
      useWhen:
        "Use when Noxe owns most of the scope and the client burden is intentionally low.",
      pattern: [
        "Summarize that Noxe handles supply, installation, configuration, validation, and handoff.",
        "End with a clear client prerequisite if one exists, then say the rest is handled by Noxe.",
      ],
    },
    {
      name: "strict exclusions",
      useWhen:
        "Use on all production-ready quotes unless the quote is a negotiated contract form that already governs scope boundaries.",
      pattern: [
        "List exclusions as plain statements, not soft recommendations.",
        "Cover work by others, TI/network items, civil/electrical scope, and unspecified work.",
      ],
    },
  ],
};
