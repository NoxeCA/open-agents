import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import type { QuoteData } from "@/lib/quote/schema";

import { syncDurableMemoryFromQuote } from "./durable-quote-memory";

type QuoteForPersistence = {
  id: string;
  title: string;
  lang: "fr" | "en";
};

export async function persistQuoteData({
  quote,
  data,
}: {
  quote: QuoteForPersistence;
  data: Partial<QuoteData>;
}) {
  const updatedAt = new Date();

  await db
    .update(quotes)
    .set({ data, updatedAt })
    .where(eq(quotes.id, quote.id));

  await syncDurableMemoryFromQuote({
    quote,
    data,
  });
}
