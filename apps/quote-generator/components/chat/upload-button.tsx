"use client";

import { Loader2, Paperclip } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  quoteId: string;
  onUploaded: (fileId: string, filename: string) => void;
  disabled?: boolean;
};

export function UploadButton({ quoteId, onUploaded, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/quotes/${quoteId}/files`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }
      const data = (await res.json()) as {
        fileId?: string;
        id?: string;
        filename?: string;
        name?: string;
      };
      const fileId = data.fileId ?? data.id;
      const filename = data.filename ?? data.name ?? file.name;
      if (!fileId) throw new Error("Upload response missing fileId");
      onUploaded(fileId, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handlePick}
        disabled={disabled || isUploading}
        title="Upload an Excel file"
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
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
