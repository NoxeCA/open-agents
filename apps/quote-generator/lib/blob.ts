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
  const buf =
    opts.body instanceof ArrayBuffer ? new Uint8Array(opts.body) : opts.body;

  const res = await put(opts.pathname, buf as Uint8Array | Buffer, {
    access: "public",
    contentType: opts.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

  const size =
    buf instanceof Uint8Array ? buf.byteLength : (buf as Buffer).length;

  return { url: res.url, pathname: res.pathname, size };
}

export async function downloadBlob(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Blob fetch failed: ${res.status}`);
  }
  return await res.arrayBuffer();
}
