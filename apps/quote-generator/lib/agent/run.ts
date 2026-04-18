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
    messages: await convertToModelMessages(opts.messages),
    tools: buildTools({ quoteId: opts.quoteId, userId: opts.userId }),
    stopWhen: stepCountIs(MAX_STEPS),
    onFinish: opts.onFinish,
  });
}
