"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "@/components/chat/message-list";
import { UploadButton } from "@/components/chat/upload-button";

type Props = {
  quoteId: string;
  chatId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMessages: any[];
  onQuoteUpdated: () => void | Promise<void>;
};

type PartLike = {
  type?: string;
  state?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
};

type MessageLike = {
  id?: string;
  role?: string;
  parts?: PartLike[];
};

function isRefreshableToolPart(part: PartLike): boolean {
  if (!part?.type || !part.type.startsWith("tool-")) return false;
  if (part.state !== "output-available") return false;
  const name = part.type.slice("tool-".length);
  if (name !== "render_pdf" && name !== "patch_quote") return false;
  // Treat any output-available as a "success"; tool errors use output-error.
  return true;
}

export function ChatPane({
  quoteId,
  chatId,
  initialMessages,
  onQuoteUpdated,
}: Props) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { quoteId, chatId },
      }),
    [quoteId, chatId],
  );

  const chat = useChat({
    id: chatId,
    transport,
    messages: initialMessages,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // AI SDK v5 exposes: messages, status, sendMessage, addToolOutput, etc.
  // We access via `any` to stay compatible across minor shape differences.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = chat as any;
  const messages: MessageLike[] = c.messages ?? [];
  const status: string = c.status ?? "ready";
  const sendMessage: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg: any,
  ) => void | Promise<void> = c.sendMessage ?? c.append;
  const addToolOutput:
    | ((args: {
        tool?: string;
        toolCallId: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output: any;
      }) => void)
    | undefined = c.addToolOutput ?? c.addToolResult;

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastRefreshedMessageIdRef = useRef<string | null>(null);

  const isStreaming = status === "streaming" || status === "submitted";
  const canSubmit = input.trim().length > 0 && !isStreaming;

  // Scroll to bottom when a new message arrives.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, status]);

  // When the latest assistant message contains a successful render_pdf or
  // patch_quote tool part, refresh the preview.
  useEffect(() => {
    if (isStreaming) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    const id = last.id ?? String(messages.length - 1);
    if (lastRefreshedMessageIdRef.current === id) return;
    const parts = last.parts ?? [];
    if (parts.some(isRefreshableToolPart)) {
      lastRefreshedMessageIdRef.current = id;
      void onQuoteUpdated();
    }
  }, [messages, isStreaming, onQuoteUpdated]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const text = input.trim();
    setInput("");
    try {
      void sendMessage({ text });
    } catch {
      // Fallback shape for older API.
      void sendMessage({ role: "user", content: text });
    }
  }, [canSubmit, input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleFileUploaded = useCallback(
    (fileId: string, filename: string) => {
      try {
        void sendMessage({
          text: `I uploaded ${filename} (fileId: ${fileId}). Please parse it and propose a quote skeleton.`,
        });
      } catch {
        void sendMessage({
          role: "user",
          content: `I uploaded ${filename} (fileId: ${fileId}). Please parse it and propose a quote skeleton.`,
        });
      }
    },
    [sendMessage],
  );

  const onToolOutput = useMemo(() => {
    if (!addToolOutput) return undefined;
    return (args: {
      tool?: string;
      toolCallId: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output: any;
    }) => addToolOutput(args);
  }, [addToolOutput]);

  return (
    <div className="flex h-full flex-col bg-background">
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="mx-auto max-w-3xl px-4 py-6">
          <MessageList messages={messages} onToolOutput={onToolOutput} />
          {isStreaming && (
            <div className="mt-4 text-sm text-muted-foreground">
              Assistant is thinking…
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t bg-background p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <UploadButton
            quoteId={quoteId}
            onUploaded={handleFileUploaded}
            disabled={isStreaming}
          />
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the assistant, or paste details…"
            rows={2}
            className="min-h-[2.5rem] flex-1 resize-none"
          />
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Send
          </Button>
        </div>
        <p className="mx-auto mt-1 max-w-3xl px-1 text-[11px] text-muted-foreground">
          Press Cmd/Ctrl + Enter to send
        </p>
      </div>
    </div>
  );
}
