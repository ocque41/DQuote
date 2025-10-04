import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { eachDayOfInterval, subDays } from "date-fns";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { getViewerContext } from "@/server/auth";
import { prisma } from "@/server/prisma";

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export default async function DashboardPage() {
  const session = await requireUser({ returnTo: "/dashboard" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  let viewer: Awaited<ReturnType<typeof getViewerContext>> = null;
  let schemaMissing = false;
  let databaseError = false;
  let errorMessage = "";

  try {
    viewer = await getViewerContext(session.user);
  } catch (error) {
    console.error("Dashboard error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      schemaMissing = true;
      console.error(
        "Dashboard OrgMember lookup failed because migrations have not been applied. Run `prisma migrate deploy` against the production database and redeploy.",
        error
      );
    } else if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError ||
      (error instanceof Error && error.message.includes("database server"))
    ) {
      databaseError = true;
      errorMessage = error instanceof Error ? error.message : "Database connection failed";
      console.error("Database connection error:", error);
    } else {
      databaseError = true;
      errorMessage = "An unexpected error occurred while loading dashboard data";
      console.error("Unexpected dashboard error:", error);
    }
  }

  if (schemaMissing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Database migrations required</h1>
        <p className="text-muted-foreground max-w-2xl">
          The dashboard needs the <code>OrgMember</code> table before it can load. Deploy the latest Prisma migrations to your Neon production database by running <code>prisma migrate deploy</code> (ensure Vercel&apos;s <code>DATABASE_URL</code> targets the correct branch) and redeploy this app.
        </p>
      </div>
    );
  }

  if (databaseError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Database connection issue</h1>
        <p className="text-muted-foreground max-w-2xl">
          We&apos;re having trouble connecting to the database. This might be a temporary issue. Please try refreshing the page in a few moments.
        </p>
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Technical details</summary>
          <p className="mt-2 font-mono text-xs">{errorMessage}</p>
        </details>
      </div>
    );
  }

  if (!viewer) {
    redirect("/login?redirect=/dashboard");
  }

  const proposals = await prisma.proposal.findMany({
    where: { orgId: viewer.org.id },
    include: {
      client: true,
      quote: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(thirtyDaysAgo, 30);

  const sentLast30Days = proposals.filter(
    (proposal) => proposal.createdAt >= thirtyDaysAgo && proposal.status !== "DRAFT"
  ).length;
  const sentPrevious30Days = proposals.filter(
    (proposal) =>
      proposal.createdAt >= sixtyDaysAgo &&
      proposal.createdAt < thirtyDaysAgo &&
      proposal.status !== "DRAFT"
  ).length;

  const sentChangePct = sentPrevious30Days
    ? ((sentLast30Days - sentPrevious30Days) / sentPrevious30Days) * 100
    : null;

  const acceptedProposals = proposals.filter((proposal) => proposal.status === "ACCEPTED");
  const declinedProposals = proposals.filter((proposal) => proposal.status === "DECLINED");
  const totalDecisions = acceptedProposals.length + declinedProposals.length;
  const winRatePct = totalDecisions
    ? (acceptedProposals.length / totalDecisions) * 100
    : null;

  const turnaroundDurations = acceptedProposals
    .map((proposal) =>
      proposal.quote?.acceptedAt
        ? (proposal.quote.acceptedAt.getTime() - proposal.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
        : null
    )
    .filter((value): value is number => value !== null && value >= 0);

  const averageTurnaroundDays = median(turnaroundDurations);

  const openPipeline = proposals.filter((proposal) =>
    proposal.status === "SENT" || proposal.status === "VIEWED"
  ).length;

  const chartDays = eachDayOfInterval({ start: subDays(now, 89), end: now });
  const chartBuckets = new Map<string, { date: string; sent: number; accepted: number }>();
  chartDays.forEach((day) => {
    const key = day.toISOString().slice(0, 10);
    chartBuckets.set(key, { date: key, sent: 0, accepted: 0 });
  });

  for (const proposal of proposals) {
    if (proposal.status !== "DRAFT") {
      const key = proposal.createdAt.toISOString().slice(0, 10);
      const bucket = chartBuckets.get(key);
      if (bucket) {
        bucket.sent += 1;
      }
    }

    if (proposal.quote?.acceptedAt) {
      const acceptedKey = proposal.quote.acceptedAt.toISOString().slice(0, 10);
      const bucket = chartBuckets.get(acceptedKey);
      if (bucket) {
        bucket.accepted += 1;
      }
    }
  }

  const chartData = Array.from(chartBuckets.values());

  const pipelineRows = proposals.map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    clientName: proposal.client.name,
    clientCompany: proposal.client.company ?? null,
    status: proposal.status,
    value: proposal.quote ? Number(proposal.quote.total) : null,
    currency: proposal.quote?.currency ?? "EUR",
    updatedAt: proposal.updatedAt.toISOString(),
    shareId: proposal.shareId,
  }));

  return (
    <AppShell
      viewer={viewer}
      title="Pipeline overview"
      subtitle="Track quote velocity, conversion, and collaboration health."
      contentClassName="gap-4 lg:gap-6"
    >
      <SectionCards
        metrics={{
          sentLast30Days,
          sentChangePct,
          winRatePct,
          winRateDelta: null,
          averageTurnaroundDays,
          turnaroundDelta: null,
          openPipeline,
          openDelta: null,
        }}
      />
      <ChartAreaInteractive data={chartData} />
      <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/95 p-2 shadow-sm sm:rounded-2xl sm:p-4 lg:overflow-x-visible">
        <DataTable rows={pipelineRows} />
      </div>
    </AppShell>
  );
}
