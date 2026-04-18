const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const PDF_MIME = "application/pdf";

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "message/rfc822",
]);

export type UploadedQuoteFileKind = "excel" | "context";

export type UploadedQuoteFileCategory =
  | "excel"
  | "pdf"
  | "image"
  | "email"
  | "text";

export type UploadedQuoteFileInfo = {
  kind: UploadedQuoteFileKind;
  category: UploadedQuoteFileCategory;
  mediaType: string;
  extension: string;
};

function normalizeExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

export function classifyUploadedQuoteFile(file: File): UploadedQuoteFileInfo | null {
  const filename = file.name || "upload";
  const lowerName = filename.toLowerCase();
  const extension = normalizeExtension(lowerName);
  const mediaType = file.type || "";

  if (
    mediaType === XLSX_MIME ||
    extension === ".xlsx"
  ) {
    return {
      kind: "excel",
      category: "excel",
      mediaType: XLSX_MIME,
      extension: ".xlsx",
    };
  }

  if (mediaType === PDF_MIME || extension === ".pdf") {
    return {
      kind: "context",
      category: "pdf",
      mediaType: PDF_MIME,
      extension: ".pdf",
    };
  }

  if (
    IMAGE_MIME_TYPES.has(mediaType) ||
    [".png", ".jpg", ".jpeg", ".webp"].includes(extension)
  ) {
    const normalizedMediaType =
      mediaType ||
      {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
      }[extension] ||
      "image/png";

    return {
      kind: "context",
      category: "image",
      mediaType: normalizedMediaType,
      extension,
    };
  }

  if (
    TEXT_MIME_TYPES.has(mediaType) ||
    extension === ".eml" ||
    extension === ".txt"
  ) {
    const category = extension === ".eml" || mediaType === "message/rfc822"
      ? "email"
      : "text";

    return {
      kind: "context",
      category,
      mediaType:
        mediaType ||
        (category === "email" ? "message/rfc822" : "text/plain"),
      extension,
    };
  }

  return null;
}

export function getQuoteUploadAcceptValue() {
  return [
    ".xlsx",
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".txt",
    ".eml",
    XLSX_MIME,
    PDF_MIME,
    ...IMAGE_MIME_TYPES,
    ...TEXT_MIME_TYPES,
  ].join(",");
}

export function getStoredQuoteFilePath({
  quoteId,
  fileId,
  category,
  extension,
}: {
  quoteId: string;
  fileId: string;
  category: UploadedQuoteFileCategory;
  extension: string;
}) {
  const sanitizedExtension = extension || ".bin";

  if (category === "excel") {
    return `quotes/${quoteId}/excel/${fileId}${sanitizedExtension}`;
  }

  return `quotes/${quoteId}/context/${fileId}${sanitizedExtension}`;
}
