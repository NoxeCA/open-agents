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
  onToolOutput?: (args: {
    tool?: string;
    toolCallId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any;
  }) => void;
};

export function MessagePart({ part, onToolOutput }: Props) {
  const type: string = part.type ?? "";

  if (type === "text") {
    const text = (part.text as string | undefined) ?? "";
    return <CollapsibleMessageText text={text} />;
  }

  if (type === "step-start" || type === "step-finish") {
    return null;
  }

  // File parts (images, uploads): ignore for MVP.
  if (type === "file" || type.startsWith("file-")) return null;

  if (type.startsWith("tool-")) {
    const toolName = type.slice("tool-".length);
    const toolProps = {
      name: toolName,
      input: part.input,
      output: part.output,
      state: part.state,
      toolCallId: part.toolCallId,
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
