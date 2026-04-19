"use client";

import { Button } from "@/components/ui/button";
import { getDisplayQuoteTitle } from "@/lib/quote/display";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ChatPane } from "./chat-pane";
import { QuoteSidebar } from "./quote-sidebar";

type QuoteRow = {
  id: string;
  title: string | null;
  lang: string;
  updatedAt?: Date | string | null;
  data?: Record<string, unknown> | null;
};
type ChatRow = { id: string; quoteId: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InitialMessage = any;

type Props = {
  quote: QuoteRow;
  quoteRows: QuoteRow[];
  chat: ChatRow;
  initialMessages: InitialMessage[];
  initialPdfFileId: string | null;
};

export function QuoteWorkspace({
  quote,
  quoteRows,
  chat,
  initialMessages,
  initialPdfFileId,
}: Props) {
  const [quoteMeta, setQuoteMeta] = useState(quote);
  const [recentQuotes, setRecentQuotes] = useState(quoteRows);
  const [pdfFileId, setPdfFileId] = useState<string | null>(initialPdfFileId);
  const [quoteData, setQuoteData] = useState<Record<string, unknown> | null>(
    quote.data ?? null,
  );

  const onQuoteUpdated = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes/${quote.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.latestPdfFileId !== undefined) {
        setPdfFileId(data.latestPdfFileId ?? null);
      }
      if (data?.quote?.data !== undefined) {
        setQuoteData(data.quote.data);
      }
      if (data?.quote) {
        setQuoteMeta((current) => ({
          ...current,
          ...data.quote,
          data: data.quote.data ?? current.data,
        }));
        setRecentQuotes((current) =>
          current.map((row) =>
            row.id === quote.id
              ? {
                  ...row,
                  title:
                    data.quote.title === undefined ? row.title : data.quote.title,
                  lang: data.quote.lang ?? row.lang,
                  updatedAt: data.quote.updatedAt ?? row.updatedAt,
                }
              : row,
          ),
        );
      }
    } catch {
      // Ignore refresh errors; user can retry with a manual action.
    }
  }, [quote.id]);

  return (
    <div className="flex h-dvh w-full flex-row overflow-hidden bg-sidebar text-foreground">
      <QuoteSidebar quotes={recentQuotes} currentQuoteId={quote.id} />

      <div className="flex min-w-0 flex-1 flex-col bg-sidebar">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {getDisplayQuoteTitle(quoteMeta.title)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Devis {quote.id.slice(0, 8)} · {quoteMeta.lang} ·{" "}
              {pdfFileId ? "PDF prêt" : "Brouillon en cours"}
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="lg:hidden">
            <Link href="/quotes">Tous les devis</Link>
          </Button>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
          <ChatPane
            quoteId={quote.id}
            quoteTitle={getDisplayQuoteTitle(quoteMeta.title)}
            quoteData={quoteData}
            pdfFileId={pdfFileId}
            chatId={chat.id}
            initialMessages={initialMessages}
            onQuoteUpdated={onQuoteUpdated}
          />
        </div>
      </div>
    </div>
  );
}
