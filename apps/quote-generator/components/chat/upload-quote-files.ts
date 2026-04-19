"use client";

export type UploadedQuoteFile = {
  fileId: string;
  filename: string;
  kind: "excel" | "context";
  mediaType: string;
  category?: string;
};

export type UploadQuoteFileFailure = {
  filename: string;
  message: string;
};

export type UploadQuoteFilesResult = {
  uploaded: UploadedQuoteFile[];
  failures: UploadQuoteFileFailure[];
};

function normalizeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Le téléversement a échoué";
}

export async function uploadQuoteFiles({
  quoteId,
  files,
}: {
  quoteId: string;
  files: File[];
}): Promise<UploadQuoteFilesResult> {
  const uploaded: UploadedQuoteFile[] = [];
  const failures: UploadQuoteFileFailure[] = [];

  for (const file of files) {
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/quotes/${quoteId}/files`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || `Upload failed (${res.status})`);
      }

      const data = (await res.json()) as {
        fileId?: string;
        id?: string;
        filename?: string;
        name?: string;
        kind?: "excel" | "context";
        mediaType?: string;
        category?: string;
      };

      const fileId = data.fileId ?? data.id;
      if (!fileId) {
        throw new Error("La réponse du serveur ne contient pas de fileId");
      }

      uploaded.push({
        fileId,
        filename: data.filename ?? data.name ?? file.name,
        kind: data.kind ?? "context",
        mediaType: data.mediaType ?? file.type ?? "application/octet-stream",
        category: data.category,
      });
    } catch (error) {
      failures.push({
        filename: file.name,
        message: normalizeErrorMessage(error),
      });
    }
  }

  return { uploaded, failures };
}

export function formatUploadFailures(failures: UploadQuoteFileFailure[]) {
  if (failures.length === 0) return null;
  if (failures.length === 1) {
    const [failure] = failures;
    return `${failure.filename}: ${failure.message}`;
  }

  return [
    "Certains fichiers n'ont pas pu être téléversés :",
    ...failures.map((failure) => `${failure.filename}: ${failure.message}`),
  ].join(" ");
}
