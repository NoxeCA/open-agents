"use client";

import { Eye, EyeOff, FileStack, Grip, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildQuoteStructureState,
  quotePricingLayoutOptions,
} from "@/lib/quote/layout-controls";

type PatchOp = {
  op: "add" | "replace" | "remove" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
};

type Props = {
  quoteId: string;
  quoteData: Record<string, unknown> | null | undefined;
  pdfFileId: string | null;
  onQuotePatched: (nextData: Record<string, unknown>) => void | Promise<void>;
};

function Row({
  label,
  description,
  right,
  muted = false,
  className,
}: {
  label: string;
  description: string;
  right?: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-3",
        muted && "bg-muted/40",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function QuoteStructurePanel({
  quoteId,
  quoteData,
  pdfFileId,
  onQuotePatched,
}: Props) {
  const structure = useMemo(
    () => buildQuoteStructureState(quoteData),
    [quoteData],
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPatch = useCallback(
    async (actionKey: string, ops: PatchOp[]) => {
      setPendingKey(actionKey);
      setError(null);

      try {
        const response = await fetch(`/api/quotes/${quoteId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ops }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.quote?.data) {
          throw new Error(payload?.error ?? "Impossible de mettre à jour le devis.");
        }

        await onQuotePatched(payload.quote.data as Record<string, unknown>);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de mettre à jour le devis.",
        );
      } finally {
        setPendingKey(null);
      }
    },
    [onQuotePatched, quoteId],
  );

  const lang = structure.lang;

  return (
    <aside className="hidden h-full w-[340px] shrink-0 border-l border-border/50 bg-muted/20 xl:flex xl:flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Structure rapide</p>
          <p className="text-xs text-muted-foreground">
            {lang === "fr"
              ? "Masquer, alléger et enlever des sections sans repasser par le chat."
              : "Hide, lighten, and remove sections without going back to chat."}
          </p>
        </div>
        <Badge variant="outline" className="gap-1 rounded-full">
          <Grip className="size-3" />
          PDF
        </Badge>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {lang === "fr" ? "Pages" : "Pages"}
            </p>
            <Badge variant="secondary">{structure.sections.length + 2}</Badge>
          </div>

          {structure.fixedPages.map((page, index) => (
            <Row
              key={page.key}
              label={`${String(index + 1).padStart(2, "0")} ${page.label}`}
              description={page.description}
              muted
              right={
                <Badge variant="outline" className="rounded-full">
                  {lang === "fr" ? "Fixe" : "Fixed"}
                </Badge>
              }
            />
          ))}

          {structure.sections.map((section, sectionIndex) => {
            const actionKey = `section:${section.key}`;
            const isPending = pendingKey === actionKey;
            const label = `${String(sectionIndex + 3).padStart(2, "0")} ${section.label}`;

            return (
              <div key={section.key} className="space-y-2">
                <Row
                  label={label}
                  description={section.description}
                  right={
                    section.locked ? (
                      <Badge variant="outline" className="rounded-full">
                        {lang === "fr" ? "Fixe" : "Fixed"}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant={section.enabled ? "secondary" : "outline"}
                        disabled={isPending || !section.visibilityPath}
                        onClick={() =>
                          runPatch(actionKey, [
                            {
                              op: "replace",
                              path: section.visibilityPath ?? "/",
                              value: !section.enabled,
                            },
                          ])
                        }
                        className="min-w-[88px] justify-center rounded-full"
                      >
                        {section.enabled ? (
                          <>
                            <Eye className="size-3.5" />
                            {lang === "fr" ? "Visible" : "Visible"}
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3.5" />
                            {lang === "fr" ? "Masqué" : "Hidden"}
                          </>
                        )}
                      </Button>
                    )
                  }
                />

                {section.key === "services" &&
                section.enabled &&
                section.children.length > 0 ? (
                  <div className="space-y-2 pl-4">
                    {section.children.map((child) => {
                      const childActionKey = `service:${child.index}`;
                      const childPending = pendingKey === childActionKey;

                      return (
                        <Row
                          key={child.key}
                          label={child.label}
                          description={child.description}
                          className="border-dashed bg-background/60"
                          right={
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={childPending || !child.removable}
                              onClick={() =>
                                runPatch(childActionKey, [
                                  {
                                    op: "remove",
                                    path: child.removePath,
                                  },
                                ])
                              }
                              className="size-8 rounded-full"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          }
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {lang === "fr" ? "Détail des prix" : "Pricing detail"}
          </p>

          <div className="space-y-2 rounded-3xl border border-border/70 bg-background/70 p-2">
            {quotePricingLayoutOptions.map((option) => {
              const active = structure.pricingLayout === option.id;
              const actionKey = `layout:${option.id}`;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={pendingKey === actionKey}
                  onClick={() =>
                    runPatch(actionKey, [
                      {
                        op: "replace",
                        path: structure.pricingLayoutPath,
                        value: option.id,
                      },
                    ])
                  }
                  className={cn(
                    "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:border-foreground/30 hover:bg-muted/50",
                  )}
                >
                  <p className="text-sm font-medium">
                    {option.label[lang]}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs leading-5",
                      active ? "text-background/80" : "text-muted-foreground",
                    )}
                  >
                    {option.description[lang]}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2 rounded-3xl border border-border/70 bg-background/70 p-4">
          <div className="flex items-center gap-2">
            <FileStack className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {lang === "fr" ? "Quand passer par le chat" : "When to use chat"}
            </p>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {lang === "fr"
              ? "Utilise le chat pour fusionner des pages, ajouter une image ou un plan, insérer un tableau libre, ou créer une page d’appendice plus créative."
              : "Use chat to merge pages, add an image or plan, insert a custom table, or create a more creative appendix page."}
          </p>
          {pdfFileId ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a
                href={`/api/quotes/${quoteId}/pdfs/${pdfFileId}`}
                target="_blank"
                rel="noreferrer"
              >
                {lang === "fr" ? "Ouvrir le PDF actuel" : "Open current PDF"}
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {lang === "fr"
                ? "Aucun PDF à jour pour le moment."
                : "No up-to-date PDF yet."}
            </p>
          )}
        </section>

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
