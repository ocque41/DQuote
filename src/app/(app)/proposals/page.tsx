import { redirect } from "next/navigation";

import { getViewerContext } from "@/server/auth";
import { prisma } from "@/server/prisma";
import { ProposalsTable } from "./proposals-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ProposalsIndexPage() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/handler/sign-in");
  }

  const proposals = await prisma.proposal.findMany({
    where: { orgId: viewer.org.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      client: true,
      quote: true,
    },
  });

  const tableData = proposals.map((proposal) => ({
    id: proposal.id,
    shareId: proposal.shareId,
    title: proposal.title,
    status: proposal.status,
    updatedAt: proposal.updatedAt.toISOString(),
    createdAt: proposal.createdAt.toISOString(),
    expiresAt: proposal.expiresAt?.toISOString() ?? null,
    client: {
      name: proposal.client.name,
      company: proposal.client.company ?? null,
    },
    value: proposal.quote ? Number(proposal.quote.total) : null,
    currency: proposal.quote?.currency ?? "EUR",
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Proposals</h1>
            <p className="text-sm text-muted-foreground">
              Monitor every share link in flight across {viewer.org.name} and jump into proposals that need attention.
            </p>
          </div>
          <Button asChild size="sm" className="self-start">
            <Link href="/quotes/new">Create new quote</Link>
          </Button>
        </div>
      </header>
      <ProposalsTable proposals={tableData} />
    </div>
  );
}
