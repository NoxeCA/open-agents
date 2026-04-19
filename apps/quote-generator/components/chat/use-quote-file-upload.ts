"use client";

import { useCallback, useState } from "react";

import {
  formatUploadFailures,
  uploadQuoteFiles,
  type UploadedQuoteFile,
} from "./upload-quote-files";

export function useQuoteFileUpload({
  quoteId,
  onUploaded,
}: {
  quoteId: string;
  onUploaded: (files: UploadedQuoteFile[]) => void | Promise<void>;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadFiles = useCallback(
    async (incoming: File[] | FileList | null | undefined) => {
      const files = Array.from(incoming ?? []);
      if (files.length === 0 || isUploading) return;

      setError(null);
      setIsUploading(true);
      try {
        const result = await uploadQuoteFiles({ quoteId, files });

        if (result.uploaded.length > 0) {
          await Promise.resolve(onUploaded(result.uploaded));
        }

        const failureMessage = formatUploadFailures(result.failures);
        if (failureMessage) {
          setError(failureMessage);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Le téléversement a échoué",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading, onUploaded, quoteId],
  );

  return {
    clearError,
    error,
    isUploading,
    uploadFiles,
  };
}
