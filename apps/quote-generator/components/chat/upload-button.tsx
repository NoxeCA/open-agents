"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { getQuoteUploadAcceptValue } from "@/lib/files/quote-file-types";

type Props = {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  error?: string | null;
  isUploading?: boolean;
};

export function UploadButton({
  onFilesSelected,
  disabled,
  error,
  isUploading = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;
    onFilesSelected(files);
  };

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handlePick}
        disabled={disabled || isUploading}
        title="Upload one or more workbooks, PDFs, images, or emails"
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Paperclip className="size-4" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={getQuoteUploadAcceptValue()}
        multiple
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
