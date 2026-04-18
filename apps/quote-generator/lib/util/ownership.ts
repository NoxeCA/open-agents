import { db } from "@/lib/db";
import { quotes, chats } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export class QuoteNotFoundError extends Error {
  constructor(public readonly quoteId: string) {
    super(`Quote ${quoteId} not found`);
    this.name = "QuoteNotFoundError";
  }
}

export async function requireQuoteOwnership(quoteId: string, userId: string) {
  // Use `db.select()` fallback because the schema barrel hasn't defined
  // relations yet, so `db.query.*` wouldn't type-check here.
  const [quote] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)))
    .limit(1);
  if (!quote) throw new QuoteNotFoundError(quoteId);
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.quoteId, quoteId))
    .limit(1);
  if (!chat) throw new QuoteNotFoundError(quoteId);
  return { quote, chat };
}
