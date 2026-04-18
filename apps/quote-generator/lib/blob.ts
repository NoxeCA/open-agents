import { put } from "@vercel/blob";

export type UploadBlobOpts = {
  pathname: string;
  body: ArrayBuffer | Buffer | Uint8Array;
  contentType: string;
};

export type UploadBlobResult = {
  url: string;
  pathname: string;
  size: number;
};

export async function uploadBlob(opts: UploadBlobOpts): Promise<UploadBlobResult> {
  const buf: Buffer =
    opts.body instanceof ArrayBuffer
      ? Buffer.from(opts.body)
      : Buffer.isBuffer(opts.body)
        ? opts.body
        : Buffer.from(opts.body);

  const res = await put(opts.pathname, buf, {
    access: "public",
    contentType: opts.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

  return { url: res.url, pathname: res.pathname, size: buf.length };
}

export async function downloadBlob(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Blob fetch failed: ${res.status}`);
  }
  return await res.arrayBuffer();
}
