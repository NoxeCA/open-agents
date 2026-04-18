import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type StreamTextOnFinishCallback,
  type UIMessage,
} from "ai";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";

import { buildSystemPrompt } from "./system-prompt";
import { buildTools, type QuoteAgentTools } from "./tools";

export type RunQuoteAgentOptions = {
  quoteId: string;
  userId: string;
  messages: UIMessage[];
  onFinish?: StreamTextOnFinishCallback<QuoteAgentTools>;
};

const MODEL_ID = "claude-sonnet-4-6";
const MAX_STEPS = 25;

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

  return streamText({
    model: anthropic(MODEL_ID),
    system: buildSystemPrompt({
      quote: {
        lang,
        title: quote.title,
        data: quote.data,
      },
    }),
    messages: convertToModelMessages(opts.messages),
    tools: buildTools({ quoteId: opts.quoteId, userId: opts.userId }),
    stopWhen: stepCountIs(MAX_STEPS),
    onFinish: opts.onFinish,
  });
}
