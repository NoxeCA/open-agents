"use server";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import { applyPatch } from "@/lib/quote/patch";
import type { OptionalSectionKey } from "@/lib/quote/section-library";
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
  const next = normalizeQuoteData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyPatch(row.data as any, [op]),
  );

  await persistQuoteData({
    quote: {
      id: row.id,
      title: row.title,
      lang: row.lang,
    },
    data: next,
  });

  return { ok: true };
}

export async function toggleOptionalSection(
  quoteId: string,
  key: OptionalSectionKey,
  enabled: boolean,
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

  const next = normalizeQuoteData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyPatch(row.data as any, [
      {
        op: "replace",
        path: `/${key}`,
        value: enabled,
      },
    ]),
  );

  await persistQuoteData({
    quote: {
      id: row.id,
      title: row.title,
      lang: row.lang,
    },
    data: next,
  });

  return { ok: true };
}

export async function requestRegenerate() {
  // MVP: the user can ask the assistant to "regenerate the PDF" in chat.
  // This is left as a no-op so the UI hook-up is in place for future work.
  return { ok: true };
}
