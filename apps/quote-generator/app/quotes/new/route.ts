import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chats, quotes } from "@/lib/db/schema";
import { DEFAULT_LOCAL_APP_URL } from "@/lib/dev-auth";
import { emptyQuoteData } from "@/lib/quote/defaults";
import { newId as nanoid } from "@/lib/util/ids";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const quoteId = nanoid();
  await db.insert(quotes).values({
    id: quoteId,
    userId: session.user.id,
    title: "Devis sans titre",
    lang: "fr",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: emptyQuoteData() as any,
  });
  await db.insert(chats).values({ id: nanoid(), quoteId });

  const baseUrl = process.env.BETTER_AUTH_URL ?? DEFAULT_LOCAL_APP_URL;
  return NextResponse.redirect(new URL(`/quotes/${quoteId}`, baseUrl), {
    status: 303,
  });
}
