"use server";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { applyPatch } from "@/lib/quote/patch";
import { requireQuoteOwnership } from "@/lib/util/ownership";

export async function patchScalarField(
  quoteId: string,
  path: string,
  value: string,
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await requireQuoteOwnership(quoteId, session.user.id);

  const [row] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);
  if (!row) throw new Error("Quote not found");

  const op = {
    op: "replace" as const,
    path: "/" + path.replace(/\./g, "/"),
    value,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const next = applyPatch(row.data as any, [op]);

  await db
    .update(quotes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ data: next as any, updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  return { ok: true };
}

export async function requestRegenerate(_quoteId: string) {
  // MVP: the user can ask the assistant to "regenerate the PDF" in chat.
  // This is left as a no-op so the UI hook-up is in place for future work.
  return { ok: true };
}
