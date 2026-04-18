import { Output, generateText, tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { downloadBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { quoteFiles } from "@/lib/db/schema";

import {
  contextFileAnalysisSchema,
  type ContextFileAnalysis,
} from "../context-file-analysis";
import { resolveQuoteAgentModel } from "../model";

import type { InspectContextFileOutput } from "../tool-types";

const MAX_TEXT_ATTACHMENT_CHARS = 30000;

function decodeTextAttachment(buffer: ArrayBuffer) {
  const text = new TextDecoder("utf-8").decode(new Uint8Array(buffer));
  return text.length > MAX_TEXT_ATTACHMENT_CHARS
    ? `${text.slice(0, MAX_TEXT_ATTACHMENT_CHARS)}\n\n[truncated]`
    : text;
}

function buildInspectionPrompt({
  filename,
  mediaType,
  focus,
  category,
}: {
  filename: string;
  mediaType: string;
  focus?: string;
  category: "pdf" | "image" | "email" | "text";
}) {
  return [
    "You are extracting quote-relevant context from a supporting attachment for a commercial proposal.",
    "The attachment content appears before these instructions. Read the document first, then perform the task.",
    "Focus on facts that should improve the quote: customer identity, contacts, addresses, project scope, system requirements, previous quote references, pricing signals, exclusions, deadlines, and approval context.",
    "First identify short verbatim quotes or exact snippets that support your extraction. Use those as evidenceQuotes.",
    "Do not invent facts. If information is ambiguous, put it in needsConfirmation.",
    "Ignore decorative boilerplate unless it changes scope, commercial terms, or approval risk.",
    `Attachment category: ${category}.`,
    `Filename: ${filename}.`,
    `Media type: ${mediaType}.`,
    focus ? `Prioritize this user focus: ${focus}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFallbackSummaryPrompt({
  filename,
  mediaType,
  focus,
  category,
}: {
  filename: string;
  mediaType: string;
  focus?: string;
  category: "pdf" | "image" | "email" | "text";
}) {
  return [
    "Read the attachment and produce a concise but information-dense plain-text summary for a sales engineer preparing a quote.",
    "Use short sections with these headings exactly:",
    "Evidence Quotes",
    "Customer Signals",
    "Scope Signals",
    "Commercial Signals",
    "Quote Field Hints",
    "Needs Confirmation",
    "Under Quote Field Hints, use one bullet per fact in the form `label | value | confidence | quotePathHint(optional)`.",
    "Under Evidence Quotes, include exact snippets whenever available.",
    "Do not invent facts. If something is ambiguous, put it under Needs Confirmation.",
    `Attachment category: ${category}.`,
    `Filename: ${filename}.`,
    `Media type: ${mediaType}.`,
    focus ? `Prioritize this user focus: ${focus}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeSectionHeading(value: string) {
  return value
    .replace(/^#+\s*/, "")
    .replace(/[:\-–—]+$/g, "")
    .trim()
    .toLowerCase();
}

function stripListPrefix(value: string) {
  return value
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .trim();
}

function parseConfidence(value: string | undefined): "low" | "medium" | "high" {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return "medium";
}

function parseQuoteFieldHintLine(line: string) {
  const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const [label, value, confidenceRaw, quotePathHint] = parts;
  return {
    label,
    value,
    confidence: parseConfidence(confidenceRaw),
    quotePathHint,
  };
}

function parseFallbackSummary(summary: string): ContextFileAnalysis {
  const sections = {
    evidenceQuotes: [] as string[],
    customerSignals: [] as string[],
    scopeSignals: [] as string[],
    commercialSignals: [] as string[],
    quoteFieldHints: [] as ContextFileAnalysis["quoteFieldHints"],
    needsConfirmation: [] as string[],
  };

  const headingMap = new Map<string, keyof typeof sections>([
    ["evidence quotes", "evidenceQuotes"],
    ["customer signals", "customerSignals"],
    ["scope signals", "scopeSignals"],
    ["commercial signals", "commercialSignals"],
    ["quote field hints", "quoteFieldHints"],
    ["needs confirmation", "needsConfirmation"],
  ]);

  let currentSection: keyof typeof sections | null = null;

  for (const rawLine of summary.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const normalizedHeading = normalizeSectionHeading(line);
    const nextSection = headingMap.get(normalizedHeading);
    if (nextSection) {
      currentSection = nextSection;
      continue;
    }

    if (!currentSection) {
      continue;
    }

    const value = stripListPrefix(line);
    if (!value) {
      continue;
    }

    if (currentSection === "quoteFieldHints") {
      const hint = parseQuoteFieldHintLine(value);
      if (hint) {
        sections.quoteFieldHints.push(hint);
      }
      continue;
    }

    sections[currentSection].push(value as never);
  }

  return {
    evidenceQuotes: sections.evidenceQuotes.slice(0, 8),
    summary: summary.trim().slice(0, 4000),
    customerSignals: sections.customerSignals.slice(0, 8),
    scopeSignals: sections.scopeSignals.slice(0, 12),
    commercialSignals: sections.commercialSignals.slice(0, 10),
    quoteFieldHints: sections.quoteFieldHints.slice(0, 12),
    needsConfirmation: sections.needsConfirmation.slice(0, 8),
  };
}

async function summarizeContextFileForFallback({
  filename,
  mediaType,
  buffer,
  focus,
}: {
  filename: string;
  mediaType: string;
  buffer: ArrayBuffer;
  focus?: string;
}): Promise<string> {
  const lowerMediaType = mediaType.toLowerCase();
  const isPdf = lowerMediaType === "application/pdf";
  const isImage = lowerMediaType.startsWith("image/");
  const isEmail = lowerMediaType === "message/rfc822";
  const category = isPdf
    ? "pdf"
    : isImage
      ? "image"
      : isEmail
        ? "email"
        : "text";

  const content: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: Uint8Array; mediaType: string; filename: string }
    | { type: "image"; image: Uint8Array; mediaType: string }
  > = [];

  if (isPdf) {
    content.push({
      type: "file",
      data: new Uint8Array(buffer),
      mediaType,
      filename,
    });
  } else if (isImage) {
    content.push({
      type: "image",
      image: new Uint8Array(buffer),
      mediaType,
    });
  } else {
    content.push({
      type: "text",
      text: `<documents>
  <document index="1">
    <source>${filename}</source>
    <media_type>${mediaType}</media_type>
    <document_content>
${decodeTextAttachment(buffer)}
    </document_content>
  </document>
</documents>`,
    });
  }

  content.push({
    type: "text",
    text: buildFallbackSummaryPrompt({
      filename,
      mediaType,
      focus,
      category,
    }),
  });

  const { text } = await generateText({
    model: resolveQuoteAgentModel(),
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });

  return text;
}

async function analyzeContextFile({
  filename,
  mediaType,
  buffer,
  focus,
}: {
  filename: string;
  mediaType: string;
  buffer: ArrayBuffer;
  focus?: string;
}): Promise<ContextFileAnalysis> {
  const lowerMediaType = mediaType.toLowerCase();
  const isPdf = lowerMediaType === "application/pdf";
  const isImage = lowerMediaType.startsWith("image/");
  const isEmail = lowerMediaType === "message/rfc822";
  const category = isPdf
    ? "pdf"
    : isImage
      ? "image"
      : isEmail
        ? "email"
        : "text";

  const content: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: Uint8Array; mediaType: string; filename: string }
    | { type: "image"; image: Uint8Array; mediaType: string }
  > = [];

  if (isPdf) {
    content.push({
      type: "file",
      data: new Uint8Array(buffer),
      mediaType,
      filename,
    });
  } else if (isImage) {
    content.push({
      type: "image",
      image: new Uint8Array(buffer),
      mediaType,
    });
  } else {
    content.push({
      type: "text",
      text: `<documents>
  <document index="1">
    <source>${filename}</source>
    <media_type>${mediaType}</media_type>
    <document_content>
${decodeTextAttachment(buffer)}
    </document_content>
  </document>
</documents>`,
    });
  }

  content.push({
    type: "text",
    text: buildInspectionPrompt({
      filename,
      mediaType,
      focus,
      category,
    }),
  });

  try {
    const { output } = await generateText({
      model: resolveQuoteAgentModel(),
      output: Output.object({
        name: "ContextFileAnalysis",
        description:
          "Structured extraction of quote-relevant context from a supporting attachment.",
        schema: contextFileAnalysisSchema,
      }),
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    const shouldFallback =
      normalized.includes("no object generated") ||
      normalized.includes("did not match schema");

    if (!shouldFallback) {
      throw error;
    }

    const fallbackSummary = await summarizeContextFileForFallback({
      filename,
      mediaType,
      buffer,
      focus,
    });
    const parsedFallback = parseFallbackSummary(fallbackSummary);

    if (parsedFallback.needsConfirmation.length === 0) {
      parsedFallback.needsConfirmation.push(
        "Attachment was summarized through the fallback path. Review key facts before patching sensitive fields.",
      );
    }

    return parsedFallback;
  }
}

export function inspectContextFileTool({ quoteId }: { quoteId: string }) {
  return tool({
    description:
      "Inspect a non-Excel supporting attachment uploaded to this quote, such as a PDF plan, screenshot, previous quote, customer email, or text note. Extract quote-relevant customer, scope, and commercial context before patching or asking follow-up questions.",
    inputSchema: z.object({
      fileId: z
        .string()
        .describe("The fileId of an uploaded supporting attachment."),
      focus: z
        .string()
        .optional()
        .describe(
          "Optional user focus for what to extract, e.g. contact info, exclusions, or plan scope.",
        ),
    }),
    execute: async ({ fileId, focus }): Promise<InspectContextFileOutput> => {
      const [row] = await db
        .select()
        .from(quoteFiles)
        .where(
          and(
            eq(quoteFiles.id, fileId),
            eq(quoteFiles.quoteId, quoteId),
            eq(quoteFiles.kind, "context"),
          ),
        )
        .limit(1);

      if (!row) {
        return { ok: false, error: "Context file not found for this quote" };
      }

      try {
        const buffer = await downloadBlob(row.blobUrl);
        const analysis = await analyzeContextFile({
          filename: row.filename,
          mediaType: row.mediaType,
          buffer,
          focus,
        });

        await db
          .update(quoteFiles)
          .set({
            analysis,
            analyzedAt: new Date(),
          })
          .where(eq(quoteFiles.id, row.id));

        return {
          ok: true,
          fileId: row.id,
          filename: row.filename,
          mediaType: row.mediaType,
          evidenceQuotes: analysis.evidenceQuotes,
          summary: analysis.summary,
          customerSignals: analysis.customerSignals,
          scopeSignals: analysis.scopeSignals,
          commercialSignals: analysis.commercialSignals,
          quoteFieldHints: analysis.quoteFieldHints,
          needsConfirmation: analysis.needsConfirmation,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to inspect attachment";
        const normalized = message.toLowerCase();
        const errorCode = normalized.includes("insufficient funds") ||
            normalized.includes("top up your credits")
          ? "provider_billing"
          : normalized.includes("failed to inspect attachment")
            ? "attachment_processing"
            : "provider_execution";

        return {
          ok: false,
          error:
            error instanceof Error
              ? `Failed to inspect attachment: ${error.message}`
              : "Failed to inspect attachment",
          errorCode,
        };
      }
    },
  });
}
