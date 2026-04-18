import type { UIMessage } from "ai";

import { runQuoteAgent } from "@/lib/agent/run";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessages } from "@/lib/db/schema";
import { QuoteNotFoundError, requireQuoteOwnership } from "@/lib/util/ownership";
import { nanoid } from "@/lib/util/ids";

export const maxDuration = 60;

type ChatRequestBody = {
  messages: UIMessage[];
  quoteId: string;
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, quoteId } = body;
  if (!quoteId || !Array.isArray(messages)) {
    return new Response("Bad Request", { status: 400 });
  }

  let chat: { id: string };
  try {
    ({ chat } = await requireQuoteOwnership(quoteId, session.user.id));
  } catch (e) {
    if (e instanceof QuoteNotFoundError) {
      return new Response("Not Found", { status: 404 });
    }
    throw e;
  }

  // Best-effort persistence of the latest user message (fire-and-forget).
  void (async () => {
    try {
      const last = messages.at(-1);
      if (last?.role === "user") {
        await db.insert(chatMessages).values({
          id: nanoid(),
          chatId: chat.id,
          role: "user",
          // UIMessage parts carry the rich content the UI rendered from.
          parts: (last as { parts?: unknown[] }).parts ?? [],
        });
      }
    } catch (e) {
      console.error("chat: failed to persist user message", e);
    }
  })();

  const result = await runQuoteAgent({
    quoteId,
    userId: session.user.id,
    messages,
    onFinish: async ({ response }) => {
      // Persist every assistant / tool message emitted during this turn.
      // We intentionally keep this best-effort: DB errors must not kill the
      // stream response, which has already been sent to the client.
      try {
        const toInsert = response.messages
          .filter((m) => m.role === "assistant")
          .map((m) => ({
            id: nanoid(),
            chatId: chat.id,
            role: "assistant" as const,
            parts: Array.isArray(m.content)
              ? (m.content as unknown[])
              : ([{ type: "text", text: String(m.content) }] as unknown[]),
          }));

        if (toInsert.length > 0) {
          await db.insert(chatMessages).values(toInsert);
        }
      } catch (e) {
        console.error("chat: failed to persist assistant messages", e);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    sendSources: false,
    sendReasoning: false,
  });
}
