import { notFound, redirect } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessages, chats, quoteFiles, quotes } from "@/lib/db/schema";
import { requireQuoteOwnership } from "@/lib/util/ownership";
import { QuoteWorkspace } from "./quote-workspace";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  try {
    await requireQuoteOwnership(quoteId, session.user.id);
  } catch {
    notFound();
  }

  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);
  if (!quote) notFound();

  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.quoteId, quoteId))
    .limit(1);
  if (!chat) notFound();

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chat.id))
    .orderBy(asc(chatMessages.createdAt));

  const [latestPdf] = await db
    .select()
    .from(quoteFiles)
    .where(
      and(eq(quoteFiles.quoteId, quoteId), eq(quoteFiles.kind, "generated_pdf")),
    )
    .orderBy(desc(quoteFiles.createdAt))
    .limit(1);

  return (
    <QuoteWorkspace
      quote={quote}
      chat={chat}
      initialMessages={messages}
      initialPdfFileId={latestPdf?.id ?? null}
    />
  );
}
