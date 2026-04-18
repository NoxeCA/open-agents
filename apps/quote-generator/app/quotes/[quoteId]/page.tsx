// TODO: render the quote editor (chat + live preview).
export default async function QuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return <div>Quote {quoteId}</div>;
}
