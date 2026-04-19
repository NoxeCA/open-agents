"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { getQuoteUploadAcceptValue } from "@/lib/files/quote-file-types";
import { cn } from "@/lib/utils";

type Props = {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  error?: string | null;
  isUploading?: boolean;
  className?: string;
};

export function UploadButton({
  onFilesSelected,
  disabled,
  error,
  isUploading = false,
  className,
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
        variant="ghost"
        size="icon"
        onClick={handlePick}
        disabled={disabled || isUploading}
        title="Téléverser un ou plusieurs fichiers Excel, PDF, images ou courriels"
        className={cn(
          "rounded-full border border-border/60 bg-background shadow-[var(--shadow-card)] hover:bg-accent",
          className,
        )}
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
      {error && <p className="mt-1 pl-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
