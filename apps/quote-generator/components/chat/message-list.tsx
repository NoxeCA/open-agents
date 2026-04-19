"use client";

import { MessagePart } from "./message-part";

type PartLike = {
  type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type MessageLike = {
  id?: string;
  role?: string;
  content?: string;
  parts?: PartLike[];
};

type Props = {
  messages: MessageLike[];
  quoteId: string;
  onToolOutput?: (args: {
    tool?: string;
    toolCallId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any;
  }) => void;
};

function normalizeParts(msg: MessageLike): PartLike[] {
  if (msg.parts && msg.parts.length > 0) return msg.parts;
  if (typeof msg.content === "string" && msg.content.length > 0) {
    return [{ type: "text", text: msg.content }];
  }
  return [];
}

export function MessageList({ messages, quoteId, onToolOutput }: Props) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {messages.map((m, idx) => {
        const role = m.role ?? "assistant";
        const parts = normalizeParts(m);
        const isUser = role === "user";

        return (
          <div key={m.id ?? idx} className={isUser ? "flex justify-end" : "flex"}>
            <div className={isUser ? "flex max-w-[95%] flex-col items-end gap-3" : "flex w-full max-w-[95%] flex-col gap-3"}>
              {parts.map((p, i) => (
                <MessagePart
                  key={i}
                  part={p}
                  role={role}
                  quoteId={quoteId}
                  onToolOutput={onToolOutput}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
