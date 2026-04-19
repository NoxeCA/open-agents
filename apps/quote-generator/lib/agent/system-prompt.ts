import { isSeededQuoteJsonRenderPlaceholderSpec } from "@/lib/json-render/placeholder-spec";
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
const MAX_JSON_RENDER_DRAFT_CHARS = 16000;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectJsonRenderDraftStats(
  value: unknown,
  stats: {
    imageCount: number;
    sectionIds: Set<string>;
  },
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectJsonRenderDraftStats(item, stats);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (value.type === "Image") {
    stats.imageCount += 1;
  }

  if (value.type === "Page" && typeof value.sectionId === "string") {
    stats.sectionIds.add(value.sectionId);
  }

  if (value.type === "ServiceSection") {
    if (typeof value.sectionId === "string") {
      stats.sectionIds.add(value.sectionId);
    } else if (typeof value.sectionNumber === "number") {
      stats.sectionIds.add(`service-${value.sectionNumber}`);
    }
  }

  for (const child of Object.values(value)) {
    collectJsonRenderDraftStats(child, stats);
  }
}

function getJsonRenderDraft(data: unknown) {
  if (!isRecord(data)) {
    return null;
  }

  const jsonRender = isRecord(data.jsonRender) ? data.jsonRender : null;
  if (jsonRender && isRecord(jsonRender.spec)) {
    if (isSeededQuoteJsonRenderPlaceholderSpec(jsonRender.spec)) {
      return null;
    }
    return jsonRender.spec;
  }

  if (isRecord(data.jsonRenderDraft)) {
    return isSeededQuoteJsonRenderPlaceholderSpec(data.jsonRenderDraft)
      ? null
      : data.jsonRenderDraft;
  }

  return null;
}

function summarizeJsonRenderDraft(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  const document = isRecord(value.document) ? value.document : null;
  const children = Array.isArray(document?.children) ? document.children : [];
  const stats = {
    imageCount: 0,
    sectionIds: new Set<string>(),
  };

  collectJsonRenderDraftStats(children, stats);

  return {
    version: value.version ?? null,
    lang: document?.lang === "en" ? "en" : "fr",
    topLevelNodeCount: children.length,
    topLevelNodeTypes: children
      .map((child) =>
        isRecord(child) && typeof child.type === "string" ? child.type : "Unknown",
      )
      .filter((type, index, values) => values.indexOf(type) === index),
    pageCount: children.filter(
      (child) => isRecord(child) && child.type === "Page",
    ).length,
    serviceSectionCount: children.filter(
      (child) => isRecord(child) && child.type === "ServiceSection",
    ).length,
    attachmentCount: Array.isArray(value.attachments) ? value.attachments.length : 0,
    imageCount: stats.imageCount,
    sectionIds: Array.from(stats.sectionIds),
  };
}

function withoutHeavyDocumentArtifacts(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const record = { ...(data as Record<string, unknown>) };
  const document =
    record.document &&
    typeof record.document === "object" &&
    !Array.isArray(record.document)
      ? { ...(record.document as Record<string, unknown>) }
      : null;

  if (!document) {
    return record;
  }

  const spec =
    document.spec &&
    typeof document.spec === "object" &&
    !Array.isArray(document.spec)
      ? (document.spec as Record<string, unknown>)
      : null;

  if (spec) {
    const elements =
      spec.elements &&
      typeof spec.elements === "object" &&
      !Array.isArray(spec.elements)
        ? (spec.elements as Record<string, unknown>)
        : {};
    document.spec = {
      root: typeof spec.root === "string" ? spec.root : null,
      elementCount: Object.keys(elements).length,
    };
  }

  const jsonRenderDraft = getJsonRenderDraft(record);
  if (jsonRenderDraft) {
    record.jsonRender = {
      ...(isRecord(record.jsonRender) ? record.jsonRender : {}),
      summary: summarizeJsonRenderDraft(jsonRenderDraft),
    };
    delete record.jsonRenderDraft;
  }

  record.document = document;
  return record;
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
    ...(hintLines.length > 0
      ? hintLines.map((line) => `- ${line}`)
      : ["- none"]),
    "",
    "needs_confirmation:",
    ...(attachment.needsConfirmation.length > 0
      ? attachment.needsConfirmation.map((line) => `- ${line}`)
      : ["- none"]),
  ].join("\n");
}

function buildJsonRenderDraftContent(data: unknown) {
  const draft = getJsonRenderDraft(data);
  if (!draft) {
    return [
      "storage_path: /jsonRenderDraft",
      "status: missing",
      "",
      "No Claude-style json-render draft exists yet.",
      "Call get_document_catalog to inspect the vendored catalog prompt and asset keys, then call compose_document_spec to create the first full envelope before attempting patch_document_spec edits.",
    ].join("\n");
  }

  return [
    "storage_path: /jsonRenderDraft",
    "status: present",
    "",
    "summary:",
    safeSnapshot(summarizeJsonRenderDraft(draft), 4000),
    "",
    "draft_json:",
    safeSnapshot(draft, MAX_JSON_RENDER_DRAFT_CHARS),
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
    .map((item) =>
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

function buildCurrentPdfStructureContent(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "No valid quote data is available yet.";
  }

  const record = data as Record<string, unknown>;
  const hasNonEmptyArray = (value: unknown) =>
    Array.isArray(value) && value.length > 0;

  const sections = [
    "cover",
    "table_of_contents",
    record.includeAboutUs !== false ? "about_us" : null,
    record.includeCulture !== false ? "culture" : null,
    record.includeCeoMessage !== false && record.ceo ? "ceo_message" : null,
    record.includeTeam !== false && record.team ? "team" : null,
    record.includePartners !== false ? "partners" : null,
    "proposal_description",
    hasNonEmptyArray(record.services) ? "service_sections" : null,
    "project_summary",
    hasNonEmptyArray(record.optionalPages) ? "optional_pages" : null,
    "exclusions_and_conditions",
    record.includeTermsAndConditions !== false ? "terms_and_conditions" : null,
  ].filter((value): value is string => value !== null);

  const proposalBlocks =
    record.proposal &&
    typeof record.proposal === "object" &&
    !Array.isArray(record.proposal) &&
    Array.isArray((record.proposal as Record<string, unknown>).blocks)
      ? ((record.proposal as Record<string, unknown>).blocks as unknown[])
          .length
      : 0;
  const serviceBlockCount = hasNonEmptyArray(record.services)
    ? (record.services as Array<Record<string, unknown>>).reduce(
        (sum, service) => {
          const overviewBlocks = Array.isArray(service.overviewBlocks)
            ? service.overviewBlocks.length
            : 0;
          const tableIntroBlocks = Array.isArray(service.tableIntroBlocks)
            ? service.tableIntroBlocks.length
            : 0;
          const tableOutroBlocks = Array.isArray(service.tableOutroBlocks)
            ? service.tableOutroBlocks.length
            : 0;
          const footerBlocks = Array.isArray(service.footerBlocks)
            ? service.footerBlocks.length
            : 0;
          return (
            sum +
            overviewBlocks +
            tableIntroBlocks +
            tableOutroBlocks +
            footerBlocks
          );
        },
        0,
      )
    : 0;
  const optionalPageBlockCount = hasNonEmptyArray(record.optionalPages)
    ? (record.optionalPages as Array<Record<string, unknown>>).reduce(
        (sum, page) =>
          sum + (Array.isArray(page.blocks) ? page.blocks.length : 0),
        0,
      )
    : 0;

  return [
    `lang: ${typeof record.lang === "string" ? record.lang : "fr"}`,
    `service_count: ${hasNonEmptyArray(record.services) ? (record.services as unknown[]).length : 0}`,
    `optional_page_count: ${hasNonEmptyArray(record.optionalPages) ? (record.optionalPages as unknown[]).length : 0}`,
    `proposal_block_count: ${proposalBlocks}`,
    `service_block_count: ${serviceBlockCount}`,
    `optional_page_block_count: ${optionalPageBlockCount}`,
    `attached_document_count: ${hasNonEmptyArray(record.attachedDocuments) ? (record.attachedDocuments as unknown[]).length : 0}`,
    "region_editing_rules:",
    "- rendererMap.editableRegions is the authoritative map for page/location edits",
    "- /documentContent/regions/proposal:body/blocks = rich proposal-page narrative content",
    "- /documentContent/regions/service:n:overview/blocks = content before a service pricing table",
    "- /documentContent/regions/service:n:before-table/blocks = content above a service pricing table",
    "- /documentContent/regions/service:n:after-table/blocks = content below a service pricing table and above totals",
    "- /documentContent/regions/service:n:after-tax/blocks = content below totals and the tax disclaimer on service pricing pages",
    "- /documentContent/regions/optional:n:body/blocks = flexible appendix/custom-page body content",
    "- notes and specialConditions render on the exclusions_and_conditions page near the end of the PDF",
    "supported_rich_block_types:",
    "- heading",
    "- paragraph",
    "- quote",
    "- list",
    "- table",
    "- image",
    "- stats",
    "- divider",
    "- spacer",
    "rich_block_shape_examples:",
    '- paragraph => {"type":"paragraph","text":"...","tone":"body"}',
    '- heading => {"type":"heading","text":"...","level":"h2"}',
    '- list => {"type":"list","items":["..."]}',
    '- table => {"type":"table","columns":[{"label":"Colonne"}],"rows":[["Valeur"]]}',
    "location_to_region_defaults:",
    "- add text under the table => /documentContent/regions/service:n:after-table/blocks",
    "- add text above the table => /documentContent/regions/service:n:before-table/blocks",
    "- add text under totals or under taxes => /documentContent/regions/service:n:after-tax/blocks",
    "- add intro narrative before pricing => /documentContent/regions/service:n:overview/blocks or /documentContent/regions/proposal:body/blocks",
    "- add freeform custom page content => /documentContent/regions/optional:n:body/blocks",
    "renderer_sections:",
    ...sections.map((section) => `- ${section}`),
  ].join("\n");
}

function buildRendererMapContent(
  rendererMap: QuoteAgentPromptContext["quoteState"]["rendererMap"],
) {
  if (rendererMap.length === 0) {
    return "No renderer regions are available yet.";
  }

  return rendererMap
    .map((entry) =>
      [
        `pages: ${entry.pageStart}${entry.pageStart === entry.pageEnd ? "" : `-${entry.pageEnd}`}`,
        `title: ${entry.title}`,
        `kind: ${entry.kind}`,
        "editable_regions:",
        ...(entry.editableRegions.length > 0
          ? entry.editableRegions.flatMap((region) => [
              `- ${region.regionId}`,
              `  patch_paths: ${region.patchPaths.join(", ")}`,
              `  location_hints: ${region.locationHints.join(", ")}`,
              `  supported_blocks: ${region.supportedBlocks.join(", ") || "none"}`,
            ])
          : ["- none"]),
      ].join("\n"),
    )
    .join("\n\n");
}

function buildDocumentsBlock(opts: BuildSystemPromptOptions) {
  const { promptContext } = opts;
  const documents = [
    buildDocument({
      index: 1,
      source: "current_quote_summary",
      documentType: "working_summary",
      priority: "highest",
      content: safeSnapshot(promptContext.quoteState, 9000),
    }),
    buildDocument({
      index: 2,
      source: "current_quote_patch_target",
      documentType: "json_patch_target",
      priority: "highest",
      content: safeSnapshot(
        withoutHeavyDocumentArtifacts(opts.quote.data),
        MAX_PATCH_TARGET_CHARS,
      ),
    }),
    buildDocument({
      index: 3,
      source: "current_json_render_document",
      documentType: "json_render_draft",
      priority: "high",
      content: buildJsonRenderDraftContent(opts.quote.data),
    }),
    buildDocument({
      index: 4,
      source: "current_pdf_structure",
      documentType: "renderer_structure",
      priority: "high",
      content: buildCurrentPdfStructureContent(opts.quote.data),
    }),
    buildDocument({
      index: 5,
      source: "current_renderer_map",
      documentType: "visual_edit_map",
      priority: "high",
      content: buildRendererMapContent(promptContext.quoteState.rendererMap),
    }),
    buildDocument({
      index: 6,
      source: "source_priority",
      documentType: "source_hierarchy",
      priority: "high",
      content: buildSourcePriorityContent(promptContext.sourcePriority),
    }),
    ...promptContext.contextAttachments.map((attachment, index) =>
      buildDocument({
        index: index + 7,
        source: `context_attachment:${attachment.filename}`,
        documentType: "supporting_attachment_analysis",
        priority: "high",
        content: buildAttachmentContent(attachment),
      }),
    ),
    buildDocument({
      index: promptContext.contextAttachments.length + 7,
      source: "customer_memory",
      documentType: "memory",
      priority: "medium",
      content: safeSnapshot(promptContext.customerMemory, 4000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 8,
      source: "sales_rep_memory",
      documentType: "memory",
      priority: "medium",
      content: safeSnapshot(promptContext.salesRepContext, 5000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 9,
      source: "company_commercial_defaults",
      documentType: "approved_commercial_defaults",
      priority: "medium",
      content: safeSnapshot(promptContext.companyCommercialDefaults, 5000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 10,
      source: "company_profile",
      documentType: "brand_guidance",
      priority: "low",
      content: safeSnapshot(promptContext.companyProfile, 4000),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 11,
      source: "noxe_quote_playbook",
      documentType: "style_and_commercial_patterns",
      priority: "low",
      content: buildPlaybookContent(),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 12,
      source: "document_archetypes",
      documentType: "structure_guidance",
      priority: "low",
      content: buildArchetypeGuidanceContent(),
    }),
    buildDocument({
      index: promptContext.contextAttachments.length + 13,
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
- After any structure/layout render, render_pdf.renderSummary is the authoritative description of what the final PDF actually contains. Do not describe page removals, pricing posture, or moved commercial content from patch intent alone.
- Strong evidence: attachment evidence quotes, workbook findings, and low-risk quoteFieldHints with a clear path.
- Working state: current_quote_patch_target. Patch this exact shape, but do not treat placeholders as confirmed truth.
- For intentionally authored Claude-style appendix, TOC, or image composition work: current_json_render_document plus the latest get_document_catalog / compose_document_spec / patch_document_spec outputs are the authoritative draft surface. Ignore seeded placeholder drafts when deciding whether draft authoring already exists.
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
    On the first confirmation pass, do not silently lock in high-impact inferred fields just because they are plausible. If preparedBy, preparedFor, the real client recipient, the true project objective, the chosen total, the payment schedule, exclusions, pricing detail posture, or optional sections are still inferred rather than clearly confirmed, ask directly.
    If the workbook naturally splits scope into multiple technical buckets, explicitly validate whether the client-facing PDF should keep those buckets separate or group them into one combined service section.
    If the user asks for a shorter or more compact layout and it is ambiguous whether exclusions, payment terms, or conditions should remain on dedicated ending pages, ask that question before patching the structure.
    If the user answers only part of a kickoff batch, ask a short follow-up for the remaining blocking facts instead of assuming the unanswered fields.
    If workbook findings conflict with each other, surface the conflict in that first batch instead of picking a side and patching it as fact.
    There is no fixed hard cap on question count. Ask as many concise questions as genuinely needed, but do not pad the batch just because more are allowed.
    When the user answers, patch those answers immediately before doing anything else.
  </stage>
  <stage name="compose" exit_criteria="quote_state.renderReadiness is ready">
    Patch the smallest necessary set of fields.
    If supporting documents are incomplete, add explicit assumptions instead of hiding uncertainty.
    Keep exclusions and payment terms commercially firm and production-ready.
    For Claude-style json-render draft authoring, use the dedicated document tools only when the user is truly asking for appendix-style or freeform composition:
    - call get_document_catalog when you need the vendored component catalog, asset keys, or the full authoring prompt
    - if current_json_render_document says status: missing, call compose_document_spec with a complete envelope at /jsonRenderDraft before attempting localized draft edits
    - use patch_document_spec for targeted edits relative to the /jsonRenderDraft root, such as /document/children/0, /document/children/0/children/-, /document/children/-, or /attachments/-
    Use the json-render draft tools for appendix-style page layout, custom inserted pages, TOC composition, image placement, sectionId wiring, and component-level edits that do not map cleanly to rigid live quote fields.
    Do not use the json-render draft as the primary control plane for hiding standard live Noxe sections like overview, services, commercial, or terms.
    Document edits are region-based. When the user asks for something at a visual location, resolve it to quote_state.rendererMap[*].editableRegions first.
    In rendererMap, regionId is the stable keyed document region id, and patchPaths contain the canonical /documentContent/regions/... path to use.
    Prefer stable keyed region paths like /documentContent/regions/service:0:after-tax/blocks when patching rich content.
    Do not require a one-off schema field for every sentence. Use the nearest editable region exposed by the existing component.
    For richer custom PDF composition, prefer existing structured slots over inventing new top-level shapes:
    - /documentContent/regions/proposal:body/blocks for richer intro pages
    - /documentContent/regions/service:n:overview/blocks for pre-table narrative
    - /documentContent/regions/service:n:before-table/blocks for content above pricing tables
    - /documentContent/regions/service:n:after-table/blocks for content below pricing tables and above totals
    - /documentContent/regions/service:n:after-tax/blocks for content below totals and the tax disclaimer on service pricing pages
    - /documentContent/regions/optional:n:body/blocks for freeform appendix or story pages with headings, paragraphs, lists, tables, images, quotes, stats, dividers, and spacers
    If the user asks to "add text" in one of those regions, default to a paragraph block instead of inventing a new top-level string field.
    Use the actual rich-content block payloads, for example:
    - paragraph => {"type":"paragraph","text":"...","tone":"body"}
    - heading => {"type":"heading","text":"...","level":"h2"}
    - list => {"type":"list","items":["..."]}
    When patching inside a keyed region's blocks collection:
    - if the keyed region already has blocks, append using add ... /-
    - if the keyed region is missing, add the keyed region path with an array containing the new block
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
- In the first batch, prefer explicit confirmation over quiet assumption for high-impact business decisions. One more precise question is better than patching the wrong client, wrong total, wrong payment schedule, or wrong optional section set.
- Reuse answers already present in the chat, current quote, or attachment evidence instead of asking again.
- Prefer asking for decisions, missing customer facts, or ambiguity resolution. Do not ask for information that can be safely patched from clear document evidence.
- If quote_state.discoveryChecklist contains several missing basics, bundle them into the first ask_user_question call instead of splitting them across phases.
- If the quote_state.commercialProfile.assumptionsLikelyNeeded flag is true and field conditions are incomplete, propose a short assumptions section instead of pretending certainty.
</question_policy>

<grounding_policy>
- Before patching from an attachment or workbook inference, ground yourself in the most relevant evidence quotes or exact tool findings.
- If attachment evidence is ambiguous, do not silently patch it. Ask for confirmation.
- Report attachment-analysis failures honestly using the tool error. Do not claim a file is unreadable unless the tool explicitly says so.
- If the user refers to a page number or a visual location in the PDF, consult quote_state.rendererMap first, then choose the nearest editableRegions entry for that location.
- Use the stable keyed region path listed there. Prefer regionId-aligned paths over legacy array-indexed storage paths whenever a keyed region exists.
- The patch tool will bridge the keyed path to the current stored quote shape and report the resolved path plus touched region.
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
- Use patch_quote for commercial facts, quote structure, live section/service visibility, and legacy documentContent region edits. Use compose_document_spec / patch_document_spec for appendix-style draft pages, image-heavy insertions, and custom component composition that is not yet represented in the live handcrafted renderer.
</writing_policy>

<tool_policy>
- Always use the three canonical layout values: zero-ventilation, itemized-without-price, itemized-with-price.
- For detailed section tables, line items belong in services[n].bomItems, not services[n].items.
- The Claude-style json-render draft lives at /jsonRenderDraft.
- Use get_document_catalog before composing a new draft or whenever you need an unfamiliar component shape, asset key, or authoring rule.
- Use compose_document_spec to create or replace the full /jsonRenderDraft envelope.
- Use patch_document_spec only for targeted RFC 6902 edits relative to the draft root:
  - append a page or ServiceSection => /document/children/-
  - replace a page => /document/children/0
  - append content inside a page => /document/children/0/children/-
  - add an attachment => /attachments/-
- For custom draft page/image/TOC edits, do not force the request through patch_quote unless the user is clearly editing business data or legacy documentContent regions.
- If the user says to remove a standard quote page or section, do not patch /jsonRender/spec/... first. Use the stable live paths under /documentPlan/sectionVisibility/* or remove /services/<index>, because those are what the final handcrafted PDF renderer actually respects.
- For whole-section visibility in the live quote PDF, prefer stable paths like /documentPlan/sectionVisibility/overview, /documentPlan/sectionVisibility/services, /documentPlan/sectionVisibility/about, /documentPlan/sectionVisibility/culture, /documentPlan/sectionVisibility/leadership, /documentPlan/sectionVisibility/team, /documentPlan/sectionVisibility/partners, /documentPlan/sectionVisibility/commercial, and /documentPlan/sectionVisibility/terms.
- For the live pricing posture in the handcrafted PDF, prefer /documentPlan/pricingLayout. Changing pricing detail is a live quote-layout edit, not draft authoring.
- If the user wants to remove one extracted service section only, use remove on /services/<index> instead of hiding the whole services chapter.
- If the user asks for a “compact”, “lighter”, or “one-section” PDF and they did not explicitly mention legal/commercial ending pages, do not assume those pages should disappear. Ask whether commercial and terms pages should stay separate.
- For document edits, prefer stable keyed region paths over generic notes:
  - "under the table" => /documentContent/regions/service:n:after-table/blocks
  - "above the table" => /documentContent/regions/service:n:before-table/blocks
  - "under totals" or "under taxes" => /documentContent/regions/service:n:after-tax/blocks
  - proposal intro/body edits => /documentContent/regions/proposal:body/blocks
  - appendix/custom-page edits => /documentContent/regions/optional:n:body/blocks
- Do not prefer legacy storage paths like /services/0/tableOutroBlocks when a /documentContent/regions/... path exists for the same edit target.
- If the user wants a simple inserted sentence or paragraph in a rich-content region, create a paragraph block with the appropriate tone, using the real block shape {"type":"paragraph","text":"...","tone":"body"}.
- Do not use /notes or /specialConditions for page-specific edits inside service pricing pages. Those fields render on the exclusions_and_conditions page near the end of the PDF.
- Use /notes or /specialConditions only when the user truly means the commercial notes/conditions page near the end of the PDF.
- Keep clarifying questions short and use multiSelect when more than one answer can be valid.
- Ask a clarification question about location only when two or more editable regions are plausible. Do not ask if one region clearly matches the request.
- Do not call render_pdf more than once per user turn unless the user explicitly asks for a re-render.
- After structure/layout edits, do not tell the user what changed until render_pdf returns. Base the final explanation on renderSummary, and if renderSummary contradicts your intended edit, say that plainly instead of pretending the change landed.
- If render_pdf returns consistencyWarnings that clearly correspond to a deterministic live patch you can fix yourself (for example section visibility or pricing-layout mismatch), apply the smallest corrective patch and render once more in the same turn. If the warning is not deterministic, explain the mismatch instead of guessing.
</tool_policy>

<current_task>
${escapeXml(buildCurrentTaskContent(opts))}
</current_task>`;
}
