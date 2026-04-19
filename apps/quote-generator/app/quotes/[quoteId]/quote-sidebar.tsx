"use client";

import Link from "next/link";
import { FileStack, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { getDisplayQuoteTitle } from "@/lib/quote/display";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type QuoteListRow = {
  id: string;
  title: string | null;
  lang: string;
  updatedAt?: Date | string | null;
};

type Props = {
  quotes: QuoteListRow[];
  currentQuoteId: string;
};

function formatRelativeUpdate(date: Date | string | null | undefined) {
  if (!date) return "Aucune activité";

  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "Aucune activité";

  return formatDistanceToNow(parsed, { addSuffix: true, locale: frCA });
}

export function QuoteSidebar({ quotes, currentQuoteId }: Props) {
  return (
    <aside className="hidden h-dvh w-[260px] flex-col border-r border-sidebar-border bg-sidebar text-foreground lg:flex">
      <div className="border-b border-sidebar-border px-4 py-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Noxe</p>
          <h2 className="text-sm font-semibold">Studio de devis</h2>
          <p className="text-xs text-muted-foreground">
            Devis précédents à gauche, conversation active au centre.
          </p>
        </div>

        <div className="mt-4 grid gap-2">
          <form action="/quotes/new" method="post">
            <Button className="w-full justify-start rounded-lg">
              <Plus className="size-4" />
              Nouveau devis
            </Button>
          </form>
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start rounded-lg"
          >
            <Link href="/quotes">
              <FileStack className="size-4" />
              Tous les devis
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-3">
        <div className="flex items-center justify-between px-2 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            Devis précédents
          </p>
          <p className="text-xs text-muted-foreground">{quotes.length}</p>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 pr-2">
            {quotes.map((quote) => {
              const isActive = quote.id === currentQuoteId;

              return (
                <Link
                  key={quote.id}
                  href={`/quotes/${quote.id}`}
                  className={cn(
                    "block rounded-xl border px-3 py-2.5 transition-colors",
                    isActive
                      ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                      : "border-transparent hover:border-sidebar-border hover:bg-sidebar-accent/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {getDisplayQuoteTitle(quote.title)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Mis à jour {formatRelativeUpdate(quote.updatedAt)}
                      </p>
                    </div>
                    <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                      {quote.lang}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
