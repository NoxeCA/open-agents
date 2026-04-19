import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chats, quotes } from "@/lib/db/schema";
import { emptyQuoteData } from "@/lib/quote/defaults";
import { newId as nanoid } from "@/lib/util/ids";

export async function POST(request: Request) {
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

  return NextResponse.redirect(new URL(`/quotes/${quoteId}`, request.url), {
    status: 303,
  });
}
