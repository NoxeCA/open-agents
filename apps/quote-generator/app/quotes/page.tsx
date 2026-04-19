import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { getDisplayQuoteTitle } from "@/lib/quote/display";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function QuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.userId, session.user.id))
    .orderBy(desc(quotes.updatedAt));

  return (
    <div className="container mx-auto py-8 max-w-5xl px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Vos devis</h1>
        <form action="/quotes/new" method="post">
          <Button type="submit">+ Nouveau devis</Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <p className="mb-4">Vous n&apos;avez encore aucun devis.</p>
          <form action="/quotes/new" method="post">
            <Button type="submit">Créer votre premier devis</Button>
          </form>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead className="w-20">Lang</TableHead>
              <TableHead>Dernière mise à jour</TableHead>
              <TableHead className="w-24 text-right">Ouvrir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">
                  {getDisplayQuoteTitle(q.title)}
                </TableCell>
                <TableCell className="uppercase text-muted-foreground">
                  {q.lang}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(q.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/quotes/${q.id}`}>Ouvrir</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
