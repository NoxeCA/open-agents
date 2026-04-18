import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

const LOCAL_BLOB_SCHEME = "localblob://";
const LOCAL_BLOB_ROOT = path.join(process.cwd(), ".local", "blob-storage");

export function isLocalBlobStorageEnabled() {
  return (
    process.env.DEV_LOCAL_BLOB === "true" ||
    (process.env.NODE_ENV !== "production" &&
      !process.env.BLOB_READ_WRITE_TOKEN)
  );
}

function getBuffer(body: UploadBlobOpts["body"]): Buffer {
  return body instanceof ArrayBuffer
    ? Buffer.from(body)
    : Buffer.isBuffer(body)
      ? body
      : Buffer.from(body);
}

function toLocalBlobUrl(pathname: string) {
  return `${LOCAL_BLOB_SCHEME}${pathname.replace(/^\/+/, "")}`;
}

function fromLocalBlobUrl(url: string) {
  return url.slice(LOCAL_BLOB_SCHEME.length).replace(/^\/+/, "");
}

function getLocalBlobPath(pathname: string) {
  return path.join(LOCAL_BLOB_ROOT, pathname);
}

export async function uploadBlob(opts: UploadBlobOpts): Promise<UploadBlobResult> {
  const buf = getBuffer(opts.body);

  if (isLocalBlobStorageEnabled()) {
    const normalizedPathname = opts.pathname.replace(/^\/+/, "");
    const outputPath = getLocalBlobPath(normalizedPathname);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, buf);

    return {
      url: toLocalBlobUrl(normalizedPathname),
      pathname: normalizedPathname,
      size: buf.length,
    };
  }

  const res = await put(opts.pathname, buf, {
    access: "public",
    contentType: opts.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

  return { url: res.url, pathname: res.pathname, size: buf.length };
}

export async function downloadBlob(url: string): Promise<ArrayBuffer> {
  if (url.startsWith(LOCAL_BLOB_SCHEME)) {
    const pathname = fromLocalBlobUrl(url);
    const buf = await readFile(getLocalBlobPath(pathname));
    return buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    );
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Blob fetch failed: ${res.status}`);
  }
  return await res.arrayBuffer();
}
