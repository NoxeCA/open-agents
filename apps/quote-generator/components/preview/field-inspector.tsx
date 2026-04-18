"use client";

import { PencilLine } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quoteData: any;
  onPatchScalar: (path: string, value: string) => Promise<void>;
};

type ScalarField = {
  path: string;
  label: string;
  value: string;
};

function toDisplay(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function collectScalars(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  prefix = "",
  depth = 0,
  acc: ScalarField[] = [],
): ScalarField[] {
  if (!obj || typeof obj !== "object" || depth > 3) return acc;
  for (const [key, raw] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (raw === null || raw === undefined) continue;
    const t = typeof raw;
    if (t === "string" || t === "number" || t === "boolean") {
      acc.push({ path, label: path, value: toDisplay(raw) });
    } else if (Array.isArray(raw)) {
      // Skip arrays; inline editing for nested rows is out of scope for MVP.
      continue;
    } else if (t === "object") {
      collectScalars(raw, path, depth + 1, acc);
    }
  }
  return acc;
}

export function FieldInspector({ quoteData, onPatchScalar }: Props) {
  const [open, setOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fields = useMemo(() => collectScalars(quoteData), [quoteData]);

  const startEdit = (f: ScalarField) => {
    setEditingPath(f.path);
    setDraftValue(f.value);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingPath(null);
    setDraftValue("");
    setError(null);
  };

  const saveEdit = (path: string) => {
    startTransition(async () => {
      try {
        await onPatchScalar(path, draftValue);
        setEditingPath(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PencilLine className="size-4" />
          Fields
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Field inspector</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {fields.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No scalar fields to edit yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {fields.map((f) => {
                const isEditing = editingPath === f.path;
                return (
                  <li
                    key={f.path}
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Label
                        className="min-w-0 flex-1 font-mono text-xs text-muted-foreground"
                        title={f.path}
                      >
                        {f.label}
                      </Label>
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(f)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <Input
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          disabled={isPending}
                        />
                        {error && (
                          <p className="text-[11px] text-destructive">
                            {error}
                          </p>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            disabled={isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(f.path)}
                            disabled={isPending}
                          >
                            {isPending ? "Saving…" : "Save"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 break-words text-foreground">
                        {f.value || (
                          <span className="italic text-muted-foreground">
                            (empty)
                          </span>
                        )}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
