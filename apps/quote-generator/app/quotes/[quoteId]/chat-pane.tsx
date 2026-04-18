"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "@/components/chat/message-list";
import { UploadButton } from "@/components/chat/upload-button";
import {
  type UploadedQuoteFile,
} from "@/components/chat/upload-quote-files";
import { useQuoteFileUpload } from "@/components/chat/use-quote-file-upload";
import { cn } from "@/lib/utils";

type Props = {
  quoteId: string;
  chatId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMessages: any[];
  onQuoteUpdated: () => void | Promise<void>;
  draftedPrompt?: string;
  draftedPromptVersion?: number;
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

function buildUploadInstruction(files: UploadedQuoteFile[]) {
  if (files.length === 1) {
    const [file] = files;
    return file.kind === "excel"
      ? `I uploaded Excel workbook ${file.filename} (fileId: ${file.fileId}). Please parse it, propose a quote skeleton, then ask one consolidated first-pass validation batch that covers the highest-value missing basics before moving into narrower follow-ups. If that requires many questions, that is okay.`
      : `I uploaded supporting context file ${file.filename} (fileId: ${file.fileId}, mediaType: ${file.mediaType}${file.category ? `, category: ${file.category}` : ""}). Please inspect it, summarize the quote-relevant context it adds, and then patch the quote or ask one consolidated first-pass validation batch that covers the highest-value missing basics. If that requires many questions, that is okay.`;
  }

  const fileLines = files.map((file) =>
    file.kind === "excel"
      ? `- Excel workbook ${file.filename} (fileId: ${file.fileId})`
      : `- Supporting context file ${file.filename} (fileId: ${file.fileId}, mediaType: ${file.mediaType}${file.category ? `, category: ${file.category}` : ""})`,
  );

  return [
    "I uploaded multiple files for this quote:",
    ...fileLines,
    "",
    "Please process them in order:",
    "1. For each Excel workbook, parse it and propose a quote skeleton.",
    "2. For each supporting context file, inspect it and summarize the quote-relevant context it adds.",
    "3. Combine the information across all uploaded files before deciding what to patch next.",
    "4. Ask one consolidated first-pass validation batch for the highest-value missing basics before moving into narrower follow-ups. If that needs to be a large batch, that is okay.",
  ].join("\n");
}

function transferHasFiles(dataTransfer: DataTransfer | null) {
  return Array.from(dataTransfer?.types ?? []).includes("Files");
}

export function ChatPane({
  quoteId,
  chatId,
  initialMessages,
  onQuoteUpdated,
  draftedPrompt,
  draftedPromptVersion,
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
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // AI SDK v5 exposes: messages, status, sendMessage, addToolOutput, etc.
  // We access via `any` to stay compatible across minor shape differences.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = chat as any;
  const messages: MessageLike[] = useMemo(() => c.messages ?? [], [c.messages]);
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
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const lastRefreshedMessageIdRef = useRef<string | null>(null);
  const dragDepthRef = useRef(0);

  const isStreaming = status === "streaming" || status === "submitted";
  const canSubmit = input.trim().length > 0 && !isStreaming;

  // Scroll to bottom when a new message arrives.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, status]);

  useEffect(() => {
    if (!draftedPromptVersion || !draftedPrompt) return;
    const frame = window.requestAnimationFrame(() => {
      setInput(draftedPrompt);
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [draftedPrompt, draftedPromptVersion]);

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

  const handleFilesUploaded = useCallback(
    (files: UploadedQuoteFile[]) => {
      const text = buildUploadInstruction(files);

      try {
        void sendMessage({
          text,
        });
      } catch {
        void sendMessage({
          role: "user",
          content: text,
        });
      }
    },
    [sendMessage],
  );
  const {
    clearError: clearUploadError,
    error: uploadError,
    isUploading: isUploadingFiles,
    uploadFiles,
  } = useQuoteFileUpload({
    quoteId,
    onUploaded: handleFilesUploaded,
  });

  const handleSelectedFiles = useCallback(
    (files: File[] | FileList | null | undefined) => {
      clearUploadError();
      void uploadFiles(files);
    },
    [clearUploadError, uploadFiles],
  );

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (isStreaming || isUploadingFiles || !transferHasFiles(e.dataTransfer)) {
        return;
      }

      e.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingFiles(true);
    },
    [isStreaming, isUploadingFiles],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (isStreaming || isUploadingFiles || !transferHasFiles(e.dataTransfer)) {
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDraggingFiles(true);
    },
    [isStreaming, isUploadingFiles],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!transferHasFiles(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingFiles(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (!transferHasFiles(e.dataTransfer)) {
        return;
      }

      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFiles(false);

      if (isStreaming || isUploadingFiles) {
        return;
      }

      handleSelectedFiles(e.dataTransfer.files);
    },
    [handleSelectedFiles, isStreaming, isUploadingFiles],
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
    <div
      className="relative flex h-full flex-col bg-background"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
      <div
        className={cn(
          "border-t bg-background p-3 transition-colors",
          isDraggingFiles && "bg-muted/60",
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-3xl rounded-2xl border border-transparent p-2 transition-all",
            isDraggingFiles &&
              "border-dashed border-primary/60 bg-primary/5 shadow-sm",
          )}
        >
          <div className="flex items-end gap-2">
          <UploadButton
            onFilesSelected={handleSelectedFiles}
            disabled={isStreaming || isUploadingFiles}
            error={uploadError}
            isUploading={isUploadingFiles}
          />
          <Textarea
            ref={inputRef}
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
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
            <p>Press Cmd/Ctrl + Enter to send</p>
            <p>
              Drop one or more files here, or use the paperclip to upload in
              batch
            </p>
          </div>
        </div>
      </div>
      {isDraggingFiles && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center bg-background/40 p-6">
          <div className="rounded-2xl border border-dashed border-primary/60 bg-background/95 px-4 py-3 text-sm font-medium text-foreground shadow-lg">
            Drop files to upload them to this quote
          </div>
        </div>
      )}
    </div>
  );
}
