"use client";

import { useCallback, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPane } from "./chat-pane";
import { PreviewPane } from "./preview-pane";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QuoteRow = { id: string; title: string | null; lang: string; data: any };
type ChatRow = { id: string; quoteId: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InitialMessage = any;

type Props = {
  quote: QuoteRow;
  chat: ChatRow;
  initialMessages: InitialMessage[];
  initialPdfFileId: string | null;
};

export function QuoteWorkspace({
  quote,
  chat,
  initialMessages,
  initialPdfFileId,
}: Props) {
  const [pdfFileId, setPdfFileId] = useState<string | null>(initialPdfFileId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quoteData, setQuoteData] = useState<any>(quote.data);

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
    } catch {
      // Ignore refresh errors; user can retry with a manual action.
    }
  }, [quote.id]);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      <ResizablePanel defaultSize={55} minSize={30}>
        <ChatPane
          quoteId={quote.id}
          chatId={chat.id}
          initialMessages={initialMessages}
          onQuoteUpdated={onQuoteUpdated}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={45} minSize={25}>
        <PreviewPane
          quoteId={quote.id}
          pdfFileId={pdfFileId}
          quoteData={quoteData}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
