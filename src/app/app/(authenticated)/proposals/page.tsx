import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext } from "@/server/auth";
import { prisma } from "@/server/prisma";

export default async function ProposalsIndexPage() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/app/sign-in");
  }

  const proposals = await prisma.proposal.findMany({
    where: { orgId: viewer.org.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      client: true,
      quote: true
    }
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Proposals</h1>
        <p className="text-sm text-muted-foreground">
          Recent interactive decks ready to send for {viewer.org.name}.
        </p>
      </header>
      <div className="grid gap-4">
        {proposals.map((proposal) => {
          const quoteTotal = proposal.quote ? Number(proposal.quote.total) : null;
          const currency = proposal.quote?.currency ?? "EUR";
          const formatted =
            quoteTotal !== null
              ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
                  quoteTotal
                )
              : "—";

          return (
            <Card key={proposal.id}>
              <CardHeader>
                <CardTitle>{proposal.title}</CardTitle>
                <CardDescription>
                  {proposal.client.name}
                  {proposal.client.company ? ` · ${proposal.client.company}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="capitalize">Status: {proposal.status.toLowerCase()}</span>
                <div className="flex items-center gap-4">
                  <span>Total {formatted}</span>
                  <Link href={`/proposals/${proposal.shareId}`} className="text-primary hover:underline">
                    Open
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
