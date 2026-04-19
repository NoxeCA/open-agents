import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteFiles } from "@/lib/db/schema";
import { persistQuoteData } from "@/lib/memory/persist-quote-data";
import { normalizeQuoteData } from "@/lib/quote/normalize";
import { applyPatch, type Operation } from "@/lib/quote/patch";
import { resolveSemanticPatchOps } from "@/lib/quote/semantic-patch";
import type { QuoteData } from "@/lib/quote/schema";
import { and, eq, desc } from "drizzle-orm";
import {
  requireQuoteOwnership,
  QuoteNotFoundError,
} from "@/lib/util/ownership";

const patchRequestSchema = z.object({
  ops: z
    .array(
      z.object({
        op: z.enum(["add", "replace", "remove", "move", "copy", "test"]),
        path: z.string(),
        value: z.unknown().optional(),
        from: z.string().optional(),
      }),
    )
    .min(1),
});

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = patchRequestSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      {
        error: "Invalid patch payload",
        issues: body.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { quoteId } = await params;
  try {
    const { quote } = await requireQuoteOwnership(quoteId, session.user.id);
    const normalizedCurrent = normalizeQuoteData(
      quote.data as Partial<QuoteData>,
    );
    const resolvedOps = resolveSemanticPatchOps(normalizedCurrent, body.data.ops);
    const next = normalizeQuoteData(
      applyPatch(normalizedCurrent, resolvedOps as Operation[]),
    );

    await persistQuoteData({
      quote: {
        id: quote.id,
        title: quote.title,
        lang: quote.lang,
      },
      data: next,
    });

    return NextResponse.json({
      ok: true,
      resolvedPaths: resolvedOps.map((op) => op.path),
      quote: {
        ...quote,
        data: next,
      },
    });
  } catch (e) {
    if (e instanceof QuoteNotFoundError) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const message = e instanceof Error ? e.message : "Patch failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
