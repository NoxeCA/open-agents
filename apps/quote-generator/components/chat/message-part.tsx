"use client";

import { CollapsibleMessageText } from "@/components/chat/collapsible-message-text";
import { AskUserQuestionToolCall } from "@/components/tool-call/ask-user-question";
import { GenericToolCall } from "@/components/tool-call/generic";
import { ListQuoteLayoutsToolCall } from "@/components/tool-call/list-quote-layouts";
import { ParseExcelToolCall } from "@/components/tool-call/parse-excel";
import { PatchQuoteToolCall } from "@/components/tool-call/patch-quote";
import { ProposeQuoteSkeletonToolCall } from "@/components/tool-call/propose-quote-skeleton";
import { RenderPdfToolCall } from "@/components/tool-call/render-pdf";

type PartLike = {
  type?: string;
  text?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type Props = {
  part: PartLike;
  role: string;
  quoteId: string;
  onToolOutput?: (args: {
    tool?: string;
    toolCallId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any;
  }) => void;
};

export function MessagePart({ part, role, quoteId, onToolOutput }: Props) {
  const type: string = part.type ?? "";

  if (type === "text") {
    const text = (part.text as string | undefined) ?? "";
    if (role === "user") {
      return (
        <div className="w-fit max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 text-[13px] leading-[1.65] text-foreground shadow-[var(--shadow-card)]">
          <CollapsibleMessageText text={text} />
        </div>
      );
    }

    return (
      <div className="flex min-w-0 max-w-full flex-col gap-2 overflow-hidden text-[13px] leading-[1.65] text-foreground">
        <CollapsibleMessageText text={text} />
      </div>
    );
  }

  if (type === "step-start" || type === "step-finish") {
    return null;
  }

  // File parts (images, uploads): ignore for MVP.
  if (type === "file" || type.startsWith("file-")) return null;

  if (type === "tool-call") {
    return (
      <GenericToolCall
        name={(part.toolName as string | undefined) ?? "tool"}
        input={part.input}
        output={part.output}
        state={(part.state as string | undefined) ?? "completed"}
        toolCallId={part.toolCallId}
        quoteId={quoteId}
        onToolOutput={onToolOutput}
      />
    );
  }

  if (type.startsWith("tool-")) {
    const toolName = type.slice("tool-".length);
    const toolProps = {
      name: toolName,
      input: part.input,
      output: part.output,
      state: part.state,
      toolCallId: part.toolCallId,
      quoteId,
      onToolOutput,
    };
    switch (toolName) {
      case "parse_excel":
        return <ParseExcelToolCall {...toolProps} />;
      case "propose_quote_skeleton":
        return <ProposeQuoteSkeletonToolCall {...toolProps} />;
      case "patch_quote":
        return <PatchQuoteToolCall {...toolProps} />;
      case "ask_user_question":
        return <AskUserQuestionToolCall {...toolProps} />;
      case "render_pdf":
        return <RenderPdfToolCall {...toolProps} />;
      case "list_quote_layouts":
        return <ListQuoteLayoutsToolCall {...toolProps} />;
      default:
        return <GenericToolCall {...toolProps} />;
    }
  }

  // Dynamic-tool parts use `dynamic-tool` in v5.
  if (type === "dynamic-tool") {
    return (
      <GenericToolCall
        name={(part.toolName as string | undefined) ?? "tool"}
        input={part.input}
        output={part.output}
        state={part.state}
        toolCallId={part.toolCallId}
        onToolOutput={onToolOutput}
      />
    );
  }

  return null;
}
