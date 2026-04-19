"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { ArrowUp, Loader2, Square } from "lucide-react";

import { MessageList } from "@/components/chat/message-list";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { UploadButton } from "@/components/chat/upload-button";
import {
  type UploadedQuoteFile,
} from "@/components/chat/upload-quote-files";
import { useQuoteFileUpload } from "@/components/chat/use-quote-file-upload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  buildQuoteWorkspaceSuggestions,
} from "@/lib/quote/workspace-summary";
import { cn } from "@/lib/utils";

type Props = {
  quoteId: string;
  quoteTitle: string;
  quoteData: Record<string, unknown> | null | undefined;
  pdfFileId: string | null;
  chatId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMessages: any[];
  onQuoteUpdated: () => void | Promise<void>;
};

type PartLike = {
  type?: string;
  state?: string;
  toolName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
};

type MessageLike = {
  id?: string;
  role?: string;
  parts?: PartLike[];
};

function isRefreshableToolPart(part: PartLike): boolean {
  if (!part?.type || part.state !== "output-available") return false;
  const name =
    part.type === "tool-call"
      ? (part.toolName as string | undefined)
      : part.type.startsWith("tool-")
      ? part.type.slice("tool-".length)
        : undefined;

  return [
    "render_pdf",
    "patch_quote",
  ].includes(name ?? "");
}

function buildUploadInstruction(files: UploadedQuoteFile[]) {
  if (files.length === 1) {
    const [file] = files;
    return file.kind === "excel"
      ? `J’ai téléversé le classeur Excel ${file.filename} (fileId: ${file.fileId}). Analyse-le, propose une structure de devis, puis pose un premier lot de questions consolidé couvrant les informations manquantes les plus importantes avant de passer aux détails. S’il faut beaucoup de questions, c’est correct.`
      : `J’ai téléversé le fichier de contexte ${file.filename} (fileId: ${file.fileId}, mediaType: ${file.mediaType}${file.category ? `, catégorie: ${file.category}` : ""}). Analyse-le, résume ce qu’il apporte au devis, puis mets à jour le devis ou pose un premier lot de questions consolidé couvrant les informations manquantes les plus importantes. S’il faut beaucoup de questions, c’est correct.`;
  }

  const fileLines = files.map((file) =>
    file.kind === "excel"
      ? `- Classeur Excel ${file.filename} (fileId: ${file.fileId})`
      : `- Fichier de contexte ${file.filename} (fileId: ${file.fileId}, mediaType: ${file.mediaType}${file.category ? `, catégorie: ${file.category}` : ""})`,
  );

  return [
    "J’ai téléversé plusieurs fichiers pour ce devis :",
    ...fileLines,
    "",
    "Merci de les traiter dans cet ordre :",
    "1. Pour chaque classeur Excel, analyse-le et propose une structure de devis.",
    "2. Pour chaque fichier de contexte, analyse-le et résume l’information utile au devis qu’il ajoute.",
    "3. Combine l’information de tous les fichiers avant de décider quoi mettre à jour ensuite.",
    "4. Pose ensuite un premier lot de questions consolidé pour couvrir les informations manquantes les plus importantes avant de passer aux suivis plus fins. Si ce lot doit être grand, c’est correct.",
  ].join("\n");
}

function transferHasFiles(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) return false;
  if (dataTransfer.files.length > 0) return true;
  if (Array.from(dataTransfer.items).some((item) => item.kind === "file")) {
    return true;
  }

  return Array.from(dataTransfer.types).some(
    (type) => type === "Files" || type === "public.file-url",
  );
}

export function ChatPane({
  quoteId,
  quoteTitle,
  quoteData,
  pdfFileId,
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
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = chat as any;
  const messages: MessageLike[] = useMemo(() => c.messages ?? [], [c.messages]);
  const status: string = c.status ?? "ready";
  const sendMessage: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg: any,
  ) => void | Promise<void> = c.sendMessage ?? c.append;
  const stop: (() => void) | undefined = c.stop;
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
  const suggestions = useMemo(
    () => buildQuoteWorkspaceSuggestions({ quoteData, pdfFileId }),
    [pdfFileId, quoteData],
  );

  const resizeTextarea = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, status]);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    const preventWindowDrop = (event: globalThis.DragEvent) => {
      if (!transferHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    window.addEventListener("dragover", preventWindowDrop);
    window.addEventListener("drop", preventWindowDrop);

    return () => {
      window.removeEventListener("dragover", preventWindowDrop);
      window.removeEventListener("drop", preventWindowDrop);
    };
  }, []);

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
      void sendMessage({ role: "user", content: text });
    }

    if (inputRef.current) {
      inputRef.current.style.height = "56px";
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
        void sendMessage({ text });
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
    (e: ReactDragEvent<HTMLDivElement>) => {
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
    (e: ReactDragEvent<HTMLDivElement>) => {
      if (isStreaming || isUploadingFiles || !transferHasFiles(e.dataTransfer)) {
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDraggingFiles(true);
    },
    [isStreaming, isUploadingFiles],
  );

  const handleDragLeave = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
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
    (e: ReactDragEvent<HTMLDivElement>) => {
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

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col bg-background"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div
          className={cn(
            "mx-auto flex min-h-full w-full max-w-4xl flex-col gap-5 px-2 py-6 md:gap-7 md:px-4",
            messages.length === 0 ? "justify-center" : "pb-8",
          )}
        >
          {messages.length === 0 && (
            <div className="w-full space-y-6">
              <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Assistant de devis
                  </p>
                  <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                    Que doit-on travailler dans {quoteTitle} ?
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Téléverse des classeurs Excel, plans, courriels ou anciens
                    devis, ou demande à l’assistant de verrouiller la portée,
                    les exclusions, les modalités de paiement et les détails
                    nécessaires à un PDF prêt à envoyer.
                  </p>
                </div>

              <SuggestedPrompts
                suggestions={suggestions}
                onPick={handleSuggestedPrompt}
                layout="cards"
              />
            </div>
          )}

          {messages.length > 0 && (
            <MessageList
              messages={messages}
              quoteId={quoteId}
              onToolOutput={onToolOutput}
            />
          )}

          {isStreaming && (
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
              <Loader2 className="size-4 animate-spin" />
              <span>
                L’assistant travaille sur la prochaine étape de ce devis.
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 bg-background px-2 pb-3 md:px-4 md:pb-4",
          isDraggingFiles && "bg-background/95",
        )}
      >
        <div className="w-full">
          {suggestions.length > 0 && (
            <div className="mb-2">
              <SuggestedPrompts
                suggestions={suggestions}
                onPick={handleSuggestedPrompt}
              />
            </div>
          )}

          <div
            className={cn(
              "rounded-[28px] border border-border/60 bg-card p-2 shadow-[var(--shadow-composer)] transition-all focus-within:shadow-[var(--shadow-composer-focus)]",
              isDraggingFiles &&
                "border-foreground/15 bg-accent/40 shadow-[var(--shadow-composer-focus)]",
            )}
          >
            <div className="flex items-end gap-2">
              <UploadButton
                onFilesSelected={handleSelectedFiles}
                disabled={isStreaming || isUploadingFiles}
                error={uploadError}
                isUploading={isUploadingFiles}
                className="mb-1"
              />

              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Demandez à l’assistant de structurer la portée, valider les faits, recommander des sections ou générer le PDF..."
                rows={1}
                className="min-h-[60px] max-h-[220px] flex-1 resize-none border-0 bg-transparent px-2 py-3 text-[13px] leading-[1.65] shadow-none focus-visible:ring-0"
              />

              {isStreaming ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => stop?.()}
                  className="mb-1 rounded-full"
                >
                  <Square className="size-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  size="icon"
                  className="mb-1 rounded-full"
                  title="Envoyer"
                >
                  <ArrowUp className="size-4" />
                  <span className="sr-only">Envoyer</span>
                </Button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-3 pb-1 text-[11px] text-muted-foreground">
              <p>Appuyez sur Cmd/Ctrl + Entrée pour envoyer</p>
              <p>
                {pdfFileId
                  ? "Le dernier PDF est disponible dans les actions du chat"
                  : "Le téléversement par lot est activé pour un ou plusieurs fichiers"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isDraggingFiles && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-5 text-center shadow-[var(--shadow-float)]">
            <p className="text-sm font-semibold text-foreground">
              Déposez vos fichiers pour les joindre à ce devis
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les fichiers Excel, PDF, images, courriels et textes peuvent
              tous servir de contexte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
