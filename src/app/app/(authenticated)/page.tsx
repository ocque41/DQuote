import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRight } from "lucide-react";
import { ProposalStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext } from "@/server/auth";
import { prisma } from "@/server/prisma";

function formatMinutes(minutes: number | null) {
  if (!minutes || minutes <= 0) {
    return "—";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h${remaining ? ` ${remaining}m` : ""}`;
}

export default async function AppHomePage() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/app/sign-in");
  }

  const orgId = viewer.org.id;

  const [activeCount, totalCount, acceptedCount, recentProposals, acceptedQuotes] = await Promise.all([
    prisma.proposal.count({
      where: {
        orgId,
        status: { in: [ProposalStatus.DRAFT, ProposalStatus.SENT, ProposalStatus.VIEWED, ProposalStatus.ACCEPTED] }
      }
    }),
    prisma.proposal.count({ where: { orgId } }),
    prisma.proposal.count({ where: { orgId, status: ProposalStatus.ACCEPTED } }),
    prisma.proposal.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { quote: true, client: true }
    }),
    prisma.quote.findMany({
      where: { proposal: { orgId, status: ProposalStatus.ACCEPTED }, acceptedAt: { not: null } },
      select: { acceptedAt: true, proposal: { select: { createdAt: true } } }
    })
  ]);

  const acceptanceDurations = acceptedQuotes
    .filter((quote) => quote.acceptedAt)
    .map((quote) => quote.acceptedAt!.getTime() - quote.proposal.createdAt.getTime())
    .filter((value) => value > 0);

  const averageAcceptanceMinutes =
    acceptanceDurations.length > 0
      ? Math.round(acceptanceDurations.reduce((total, ms) => total + ms, 0) / acceptanceDurations.length / 60000)
      : null;

  const winRate = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : null;

  const currencyFormatters = new Map<string, Intl.NumberFormat>();
  const formatCurrency = (value: number, currency = "EUR") => {
    if (!currencyFormatters.has(currency)) {
      currencyFormatters.set(
        currency,
        new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 })
      );
    }
    return currencyFormatters.get(currency)!.format(value);
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border bg-card px-6 py-10 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Interactive builder dashboard</h1>
            <p className="max-w-2xl text-muted-foreground">
              Launch proposal flows, monitor selections, and drop prospects straight into checkout with deposit rules you control.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/proposals/dq-demo-aurora">
              Open demo proposal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-background px-5 py-4">
            <p className="text-sm text-muted-foreground">Active proposals</p>
            <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-2xl border bg-background px-5 py-4">
            <p className="text-sm text-muted-foreground">Avg. acceptance time</p>
            <p className="mt-2 text-2xl font-semibold">{formatMinutes(averageAcceptanceMinutes)}</p>
          </div>
          <div className="rounded-2xl border bg-background px-5 py-4">
            <p className="text-sm text-muted-foreground">Win rate</p>
            <p className="mt-2 text-2xl font-semibold">{winRate !== null ? `${winRate}%` : "—"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {recentProposals.map((proposal) => (
          <Card key={proposal.id} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{proposal.title}</CardTitle>
              <CardDescription>
                {proposal.client.name}
                {proposal.client.company ? ` · ${proposal.client.company}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Status: {proposal.status.toLowerCase()}</span>
              <div className="flex items-center gap-4">
                <span>
                  Total {proposal.quote ? formatCurrency(Number(proposal.quote.total), proposal.quote.currency) : "—"}
                </span>
                <Link href={`/proposals/${proposal.shareId}`} className="text-primary hover:underline">
                  View proposal
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
