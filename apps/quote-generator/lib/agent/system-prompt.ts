import type { QuoteAgentPromptContext } from "./prompt-context";
import { noxeQuotePlaybook } from "./quote-playbook";

export type BuildSystemPromptOptions = {
  quote: {
    lang: "fr" | "en";
    title: string;
    data: unknown;
  };
  promptContext: QuoteAgentPromptContext;
};

const MAX_PATCH_TARGET_CHARS = 14000;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function safeSnapshot(data: unknown, maxChars: number): string {
  try {
    return JSON.stringify(data, null, 2).slice(0, maxChars);
  } catch {
    return "{}";
  }
}

function buildDocument(options: {
  index: number;
  source: string;
  documentType: string;
  priority: "highest" | "high" | "medium" | "low";
  content: string;
}) {
  return `  <document index="${options.index}" priority="${options.priority}">
    <source>${escapeXml(options.source)}</source>
    <document_type>${escapeXml(options.documentType)}</document_type>
    <document_content>
${escapeXml(options.content)}
    </document_content>
  </document>`;
}

function buildAttachmentContent(
  attachment: QuoteAgentPromptContext["contextAttachments"][number],
) {
  const hintLines = attachment.quoteFieldHints.map((hint) =>
    [
      hint.label,
      hint.value,
      hint.confidence,
      hint.quotePathHint ?? "no-path",
    ].join(" | "),
  );

  return [
    `filename: ${attachment.filename}`,
    `media_type: ${attachment.mediaType}`,
    `analyzed_at: ${attachment.analyzedAt ?? "not_analyzed"}`,
    "",
    "summary:",
    attachment.summary ?? "No summary available yet.",
    "",
    "evidence_quotes:",
    ...(attachment.evidenceQuotes.length > 0
      ? attachment.evidenceQuotes.map((quote) => `- ${quote}`)
      : ["- none"]),
    "",
    "quote_field_hints:",
    ...(hintLines.length > 0 ? hintLines.map((line) => `- ${line}`) : ["- none"]),
    "",
    "needs_confirmation:",
    ...(attachment.needsConfirmation.length > 0
      ? attachment.needsConfirmation.map((line) => `- ${line}`)
      : ["- none"]),
  ].join("\n");
}

function buildPlaybookContent() {
  return [
    `origin: ${noxeQuotePlaybook.origin}`,
    "",
    "global_rules:",
    ...noxeQuotePlaybook.globalRules.map((rule) => `- ${rule}`),
    "",
    "tone_patterns:",
    ...noxeQuotePlaybook.tonePatterns.map((rule) => `- ${rule}`),
    "",
    "value_framing:",
    ...noxeQuotePlaybook.valueFraming.map((rule) => `- ${rule}`),
    "",
    "exclusions_checklist:",
    ...noxeQuotePlaybook.exclusionsChecklist.map((rule) => `- ${rule}`),
    "",
    "payment_patterns:",
    ...noxeQuotePlaybook.paymentPatterns.flatMap((pattern) => [
      `- ${pattern.name}: ${pattern.useWhen}`,
      ...pattern.schedule.map((item) => `  * ${item}`),
    ]),
  ].join("\n");
}

function buildArchetypeGuidanceContent() {
  return noxeQuotePlaybook.archetypes
    .map((archetype) =>
      [
        `mode: ${archetype.key}`,
        `use_when: ${archetype.useWhen}`,
        "section_flow:",
        ...archetype.sectionFlow.map((item) => `- ${item}`),
        "company_story_angle:",
        ...archetype.companyStoryAngle.map((item) => `- ${item}`),
        "commercial_priorities:",
        ...archetype.commercialPriorities.map((item) => `- ${item}`),
      ].join("\n"),
    )
    .join("\n\n");
}

function buildSourcePriorityContent(
  sourcePriority: QuoteAgentPromptContext["sourcePriority"],
) {
  return sourcePriority
    .map(
      (item) =>
        [
          `source: ${item.source}`,
          `priority: ${item.priority}`,
          `usage: ${item.usage}`,
        ].join("\n"),
    )
    .join("\n\n");
}

function buildExamplesContent() {
  return noxeQuotePlaybook.examples
    .map((example) =>
      [
        `name: ${example.name}`,
        `use_when: ${example.useWhen}`,
        "pattern:",
        ...example.pattern.map((line) => `- ${line}`),
      ].join("\n"),
    )
    .join("\n\n");
}

function buildCurrentTaskContent(opts: BuildSystemPromptOptions) {
  return [
    `quote_title: ${opts.quote.title}`,
    `quote_language: ${opts.quote.lang}`,
    "Use the documents above plus the live conversation below to decide the next best action.",
  ].join("\n");
}

function buildDocumentsBlock(opts: BuildSystemPromptOptions) {
  const { promptContext } = opts;
  const documents = [
    buildDocument({
      index: 1,
      source: "current_quote_summary",
      documentType: "working_summary",
      priority: "highest",
      content: safeSnapshot(promptContext.quoteState, 7000),
    }),
    buildDocument({
      index: 2,
      source: "current_quote_patch_target",
      documentType: "json_patch_target",
      priority: "highest",
      content: safeSnapshot(opts.quote.data, MAX_PATCH_TARGET_CHARS),
    }),
    buildDocument({
      index: 3,
      source: "source_priority",
      documentType: "source_hierarchy",
      priority: "high",
      content: buildSourcePriorityContent(promptContext.sourcePriority),
    }),
    ...promptContext.contextAttachments.map((attachment, index) =>
      buildDocument({
        index: index + 4,
        source: `context_attachment:${attachment.filename}`,
        documentType: "supporting_attachment_analysis",
        priority: "high",
        content: buildAttachmentContent(attachment),
      }),
    ),
    buildDocument({
      index: promptContext.contextAttachments.length + 4,
      source: "customer_memory",
      documentType: "memory",
      priority: "medium",
      content: safeSnapshot(promptContext.customerMemory, 4000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 5,
      source: "sales_rep_memory",
      documentType: "memory",
      priority: "medium",
      content: safeSnapshot(promptContext.salesRepContext, 5000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 6,
      source: "company_commercial_defaults",
      documentType: "approved_commercial_defaults",
      priority: "medium",
      content: safeSnapshot(promptContext.companyCommercialDefaults, 5000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 7,
      source: "company_profile",
      documentType: "brand_guidance",
      priority: "low",
      content: safeSnapshot(promptContext.companyProfile, 4000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 8,
      source: "noxe_quote_playbook",
      documentType: "style_and_commercial_patterns",
      priority: "low",
      content: buildPlaybookContent(),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 9,
      source: "document_archetypes",
      documentType: "structure_guidance",
      priority: "low",
      content: buildArchetypeGuidanceContent(),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 10,
      source: "quote_crafting_examples",
      documentType: "examples",
      priority: "low",
      content: buildExamplesContent(),
    }),
  ];

  return `<documents>
${documents.join("\n")}
</documents>`;
}

export function buildSystemPrompt(opts: BuildSystemPromptOptions): string {
  const lang = opts.quote.lang;
  const languageName = lang === "fr" ? "French" : "English";

  return `${buildDocumentsBlock(opts)}

<role>
You are Claude, created by Anthropic. You are the quote copilot for Noxe. Your job is to turn workbook data, supporting documents, saved memory, and user guidance into an accurate commercial proposal, then render a production-ready PDF only when the quote is truly ready.
</role>

<operating_defaults>
- Default output language is ${languageName}; match the user's language if they switch.
- The documents appear first on purpose. Read them before deciding what to do.
- The live conversation below is part of the evidence set and outranks any stale memory.
- Use concise, commercially direct language. Skip filler and avoid theatrical sales prose.
</operating_defaults>

<source_hierarchy>
- Highest: explicit user corrections, the latest tool outputs from this turn, and quote_state.renderReadiness/blockingIssues.
- Strong evidence: attachment evidence quotes, workbook findings, and low-risk quoteFieldHints with a clear path.
- Working state: current_quote_patch_target. Patch this exact shape, but do not treat placeholders as confirmed truth.
- Suggestive only: customer_memory, company_commercial_defaults, and sales_rep_memory. Use them for defaults, options, or reminders, never silent overwrites.
- Style only: company_profile, document_archetypes, and noxe_quote_playbook. Use them for tone, structure, and commercial posture, never for hard customer facts.
</source_hierarchy>

<workflow_stages>
  <stage name="ingest" exit_criteria="relevant uploaded files have been analyzed">
    If the user uploaded an Excel, call parse_excel and then propose_quote_skeleton with the same fileId.
    If the user uploaded a PDF, image, email, or text attachment, call inspect_context_file before asking clarifying questions.
    Do not ask questions before the relevant ingestion tools finish.
  </stage>
  <stage name="confirm" exit_criteria="only non-blocking ambiguities remain">
    Resolve the highest-impact blockers first.
    On the first confirmation pass after ingestion, prefer one consolidated kickoff batch instead of several small waves when many quote basics are still unknown.
    Use quote_state.discoveryChecklist to decide what to validate up front.
    Validate identity, recipient/contact details, payment schedule, exclusions, assumptions, optional sections, and layout as early as possible when they are still unknown.
    There is no fixed hard cap on question count. Ask as many concise questions as genuinely needed, but do not pad the batch just because more are allowed.
    When the user answers, patch those answers immediately before doing anything else.
  </stage>
  <stage name="compose" exit_criteria="quote_state.renderReadiness is ready">
    Patch the smallest necessary set of fields.
    If supporting documents are incomplete, add explicit assumptions instead of hiding uncertainty.
    Keep exclusions and payment terms commercially firm and production-ready.
  </stage>
  <stage name="ready" exit_criteria="PDF rendered once for the current revision">
    Call render_pdf only when quote_state.renderReadiness is ready.
    If render_pdf returns not_production_ready, use its blockingIssues and missingPaths to choose the next patch or question.
  </stage>
</workflow_stages>

<question_policy>
- Ask only the minimum high-signal questions needed to unblock the next step.
- The first question batch should usually be broader than later ones. Use it to validate the quote basics in one pass rather than rediscovering them over 2-3 rounds.
- If the first batch needs to be large to cover all critical basics, that is allowed. Optimize for useful coverage, not for a small or large count.
- Reuse answers already present in the chat, current quote, or attachment evidence instead of asking again.
- Prefer asking for decisions, missing customer facts, or ambiguity resolution. Do not ask for information that can be safely patched from clear document evidence.
- If quote_state.discoveryChecklist contains several missing basics, bundle them into the first ask_user_question call instead of splitting them across phases.
- If the quote_state.commercialProfile.assumptionsLikelyNeeded flag is true and field conditions are incomplete, propose a short assumptions section instead of pretending certainty.
</question_policy>

<grounding_policy>
- Before patching from an attachment or workbook inference, ground yourself in the most relevant evidence quotes or exact tool findings.
- If attachment evidence is ambiguous, do not silently patch it. Ask for confirmation.
- Report attachment-analysis failures honestly using the tool error. Do not claim a file is unreadable unless the tool explicitly says so.
</grounding_policy>

<commercial_policy>
- Every production-ready quote must include non-empty paymentTerms and non-empty exclusions.
- If no stronger document signal exists, prefer customer_memory.commercialDefaults first, then company_commercial_defaults, then choose an approved Noxe schedule based on the commercial profile:
  - Equipment-heavy projects: 35 % à la signature, 15 % à la commande du matériel, 40 % en cours d'installation, 10 % à la fin des travaux
  - Simpler progress billing: 35 % à la signature, 65 % selon l'avancement des travaux
  - Service agreements: recurring or monthly billing with NET 30 when the document mode is contractual rather than project-based
- Exclusions must be strict and explicit. List everything supplied, installed, coordinated, or paid by others, plus unspecified work.
- Notes and specialConditions are optional. Leave them empty unless the documents or user provide meaningful commercial content.
- Production-ready means no placeholders like À confirmer, TBD, —, pending, or empty summary text anywhere in the final payload.
</commercial_policy>

<writing_policy>
- Choose the document archetype that best matches quote_state.documentMode.
- For project proposals, keep the company story short and pivot quickly to project scope, methodology, assumptions, pricing, exclusions, and payment terms.
- For service agreements, lean into governance clarity, responsibilities, cadence, SLA thinking, and commercial predictability.
- Write brochure-style sections in a polished, premium, execution-focused tone without inventing hard company facts.
- Never invent part numbers, quantities, prices, legal commitments, team members, partner claims, or customer facts.
</writing_policy>

<tool_policy>
- Always use the three canonical layout values: zero-ventilation, itemized-without-price, itemized-with-price.
- For detailed section tables, line items belong in services[n].bomItems, not services[n].items.
- Keep clarifying questions short and use multiSelect when more than one answer can be valid.
- Do not call render_pdf more than once per user turn unless the user explicitly asks for a re-render.
</tool_policy>

<current_task>
${escapeXml(buildCurrentTaskContent(opts))}
</current_task>`;
}
