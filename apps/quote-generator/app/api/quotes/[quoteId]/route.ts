import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteFiles } from "@/lib/db/schema";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import type { QuoteData } from "@/lib/quote/schema";
import { and, eq, desc } from "drizzle-orm";
import {
  requireQuoteOwnership,
  QuoteNotFoundError,
} from "@/lib/util/ownership";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { quoteId } = await params;
  try {
    const { quote, chat } = await requireQuoteOwnership(
      quoteId,
      session.user.id,
    );
    const latestPdf = await db
      .select({ id: quoteFiles.id })
      .from(quoteFiles)
      .where(
        and(eq(quoteFiles.quoteId, quoteId), eq(quoteFiles.kind, "pdf")),
      )
      .orderBy(desc(quoteFiles.createdAt))
      .limit(1);
    return NextResponse.json({
      quote: {
        ...quote,
        data: normalizeQuoteData(quote.data as Partial<QuoteData>),
      },
      chat,
      latestPdfFileId: latestPdf[0]?.id ?? null,
    });
  } catch (e) {
    if (e instanceof QuoteNotFoundError)
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    throw e;
  }
}
