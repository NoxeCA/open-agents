import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type StreamTextOnFinishCallback,
  type UIMessage,
} from "ai";
import { eq } from "drizzle-orm";

import { normalizeUiMessages } from "@/lib/chat/normalize-ui-message";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import type { QuoteData } from "@/lib/quote/schema";

import { buildQuoteAgentPromptContext } from "./prompt-context";
import { resolveQuoteAgentModel } from "./model";
import { buildSystemPrompt } from "./system-prompt";
import { buildTools, type QuoteAgentTools } from "./tools";

export type RunQuoteAgentOptions = {
  quoteId: string;
  userId: string;
  messages: UIMessage[];
  onFinish?: StreamTextOnFinishCallback<QuoteAgentTools>;
};

const MAX_STEPS = 25;

type MessagePartLike = {
  type?: string;
};

function sanitizeMessagesForModel(messages: UIMessage[]): UIMessage[] {
  const normalizedMessages = normalizeUiMessages(messages);

  return normalizedMessages.flatMap((message) => {
    const parts = message.parts.filter((part) => {
      const type = (part as MessagePartLike).type ?? "";

      if (message.role !== "assistant") {
        return true;
      }

      // Reasoning parts are UI-only and can cause provider-side prefill
      // issues when replayed into the next model turn.
      if (type === "reasoning") {
        return false;
      }

      return true;
    });

    if (message.role === "assistant" && parts.length === 0) {
      return [];
    }

    return [{ ...message, parts }];
  });
}

export async function runQuoteAgent(opts: RunQuoteAgentOptions) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, opts.quoteId))
    .limit(1);

  if (!quote) {
    throw new Error("Quote not found");
  }

  const lang: "fr" | "en" = quote.lang === "en" ? "en" : "fr";
  const normalizedQuoteData = normalizeQuoteData(
    quote.data as Partial<QuoteData>,
  );
  const promptContext = await buildQuoteAgentPromptContext({
    quote,
    userId: opts.userId,
  });
  const modelReadyMessages = sanitizeMessagesForModel(opts.messages);

  return streamText({
    model: resolveQuoteAgentModel(),
    system: buildSystemPrompt({
      quote: {
        lang,
        title: quote.title,
        data: normalizedQuoteData,
      },
      promptContext,
    }),
    messages: await convertToModelMessages(modelReadyMessages, {
      ignoreIncompleteToolCalls: true,
    }),
    tools: buildTools({ quoteId: opts.quoteId, userId: opts.userId }),
    stopWhen: stepCountIs(MAX_STEPS),
    onFinish: opts.onFinish,
  });
}
