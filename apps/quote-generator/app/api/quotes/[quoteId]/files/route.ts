import { createHash } from "node:crypto";

import { uploadBlob } from "@/lib/blob";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteFiles } from "@/lib/db/schema";
import {
  classifyUploadedQuoteFile,
  getStoredQuoteFilePath,
} from "@/lib/files/quote-file-types";
import { nanoid } from "@/lib/util/ids";
import {
  QuoteNotFoundError,
  requireQuoteOwnership,
} from "@/lib/util/ownership";

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

type RouteContext = {
  params: Promise<{ quoteId: string }>;
};

export async function POST(req: Request, ctx: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { quoteId } = await ctx.params;

  try {
    await requireQuoteOwnership(quoteId, session.user.id);
  } catch (e) {
    if (e instanceof QuoteNotFoundError) {
      return new Response("Not Found", { status: 404 });
    }
    throw e;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const raw = form.get("file");
  if (!(raw instanceof File)) {
    return new Response("Missing 'file' field", { status: 400 });
  }

  const file = raw;
  const filename = file.name || "upload";
  const fileInfo = classifyUploadedQuoteFile(file);

  if (!fileInfo) {
    return new Response(
      "Unsupported file type. Supported: .xlsx, .pdf, .png, .jpg, .jpeg, .webp, .txt, .eml",
      { status: 415 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return new Response("File too large (max 20MB)", { status: 413 });
  }

  const buf = await file.arrayBuffer();
  // Also guard against size lies via Content-Length.
  if (buf.byteLength > MAX_SIZE_BYTES) {
    return new Response("File too large (max 20MB)", { status: 413 });
  }

  const bytes = new Uint8Array(buf);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  const fileId = nanoid();
  const pathname = getStoredQuoteFilePath({
    quoteId,
    fileId,
    category: fileInfo.category,
    extension: fileInfo.extension,
  });

  const { url, pathname: blobPathname } = await uploadBlob({
    pathname,
    body: bytes,
    contentType: fileInfo.mediaType,
  });

  await db.insert(quoteFiles).values({
    id: fileId,
    quoteId,
    kind: fileInfo.kind,
    mediaType: fileInfo.mediaType,
    blobUrl: url,
    blobPathname,
    filename,
    sizeBytes: bytes.byteLength,
    sha256,
  });

  return Response.json({
    fileId,
    kind: fileInfo.kind,
    category: fileInfo.category,
    mediaType: fileInfo.mediaType,
    filename,
    size: bytes.byteLength,
  });
}
