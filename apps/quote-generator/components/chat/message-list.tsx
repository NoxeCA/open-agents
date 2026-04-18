"use client";

import { cn } from "@/lib/utils";
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

export function MessageList({ messages, onToolOutput }: Props) {
  if (messages.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Start the conversation — upload an Excel file or describe the project to
        quote.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((m, idx) => {
        const role = m.role ?? "assistant";
        const parts = normalizeParts(m);
        return (
          <div
            key={m.id ?? idx}
            className={cn(
              "flex",
              role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[90%] space-y-2 rounded-lg px-3 py-2 text-sm",
                role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {parts.map((p, i) => (
                <MessagePart
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  part={p}
                  role={role}
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
