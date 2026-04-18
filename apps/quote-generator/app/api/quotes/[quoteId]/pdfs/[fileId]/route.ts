import { and, eq } from "drizzle-orm";

import { downloadBlob } from "@/lib/blob";
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

  const url = new URL(req.url);
  const asAttachment = url.searchParams.get("download") === "1";
  let pdfBytes: ArrayBuffer;
  try {
    pdfBytes = await downloadBlob(row.blobUrl);
  } catch {
    return new Response("Bad Gateway", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Cache-Control", "private, no-store");
  headers.set("Content-Length", String(pdfBytes.byteLength));

  if (asAttachment) {
    const safe = (row.filename ?? "quote.pdf").replace(/"/g, "");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safe}"`,
    );
  } else {
    headers.set("Content-Disposition", "inline");
  }

  return new Response(pdfBytes, {
    status: 200,
    headers,
  });
}
