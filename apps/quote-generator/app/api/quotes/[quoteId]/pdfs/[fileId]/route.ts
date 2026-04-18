import { and, eq } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteFiles } from "@/lib/db/schema";
import {
  QuoteNotFoundError,
  requireQuoteOwnership,
} from "@/lib/util/ownership";

type RouteContext = {
  params: Promise<{ quoteId: string; fileId: string }>;
};

export async function GET(req: Request, ctx: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { quoteId, fileId } = await ctx.params;

  try {
    await requireQuoteOwnership(quoteId, session.user.id);
  } catch (e) {
    if (e instanceof QuoteNotFoundError) {
      return new Response("Not Found", { status: 404 });
    }
    throw e;
  }

  const [row] = await db
    .select()
    .from(quoteFiles)
    .where(
      and(
        eq(quoteFiles.id, fileId),
        eq(quoteFiles.quoteId, quoteId),
        eq(quoteFiles.kind, "pdf"),
      ),
    )
    .limit(1);

  if (!row) {
    return new Response("Not Found", { status: 404 });
  }

  const upstream = await fetch(row.blobUrl);
  if (!upstream.ok || !upstream.body) {
    return new Response("Bad Gateway", { status: 502 });
  }

  const url = new URL(req.url);
  const asAttachment = url.searchParams.get("download") === "1";

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Cache-Control", "private, no-store");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  if (asAttachment) {
    const safe = (row.filename ?? "quote.pdf").replace(/"/g, "");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safe}"`,
    );
  } else {
    headers.set("Content-Disposition", "inline");
  }

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
