import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/server/prisma";

export default async function ProposalsIndexPage() {
  const proposals = await prisma.proposal.findMany({
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
        <p className="text-sm text-muted-foreground">Recent interactive decks ready to send.</p>
      </header>
      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader>
              <CardTitle>{proposal.title}</CardTitle>
              <CardDescription>
                {proposal.client.name}
                {proposal.client.company ? ` · ${proposal.client.company}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Status: {proposal.status}</span>
              <div className="flex items-center gap-4">
                <span>Total {proposal.quote ? Number(proposal.quote.total).toLocaleString("en-US", { style: "currency", currency: proposal.quote.currency }) : "—"}</span>
                <Link href={`/proposals/${proposal.shareId}`} className="text-primary hover:underline">
                  Open
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
