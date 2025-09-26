import { redirect } from "next/navigation";

import { EventType } from "@prisma/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext } from "@/server/auth";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

const DEMO_SHARE_ID = process.env.DEMO_PROPOSAL_SHARE_ID ?? "dq-demo-aurora";

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "—";
  }
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m${seconds ? ` ${seconds}s` : ""}`;
}

export default async function AnalyticsPage() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/app/sign-in");
  }

  if (viewer.orgUser.role !== "admin") {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Analytics are restricted to organization administrators.</p>
        </header>
      </div>
    );
  }

  const proposal = await prisma.proposal.findFirst({
    where: { shareId: DEMO_SHARE_ID, orgId: viewer.org.id },
    include: {
      slides: { orderBy: { position: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      client: true,
      org: true
    }
  });

  if (!proposal) {
    return (
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            No proposal found for share ID <span className="font-mono">{DEMO_SHARE_ID}</span>.
          </p>
        </header>
      </div>
    );
  }

  const viewEvents = proposal.events.filter((event) => event.type === EventType.VIEW);
  const viewerTimelines = new Map<string, { slideId: string; createdAt: Date }[]>();
  const slideViewCounts = new Map<string, number>();
  const slideUniqueViewers = new Map<string, Set<string>>();
  const firstSlideId = proposal.slides[0]?.id;
  const firstSlideViewers = new Set<string>();
  const firstSlideViewCount = viewEvents.filter((event) => {
    const data = event.data as Record<string, unknown> | null;
    return typeof data?.slideId === "string" && data.slideId === firstSlideId;
  }).length;

  for (const event of viewEvents) {
    const data = event.data as Record<string, unknown> | null;
    const slideId = typeof data?.slideId === "string" ? (data.slideId as string) : null;
    const viewerId = typeof data?.viewerId === "string" ? (data.viewerId as string) : null;
    if (slideId) {
      slideViewCounts.set(slideId, (slideViewCounts.get(slideId) ?? 0) + 1);
      if (viewerId) {
        if (!slideUniqueViewers.has(slideId)) {
          slideUniqueViewers.set(slideId, new Set());
        }
        slideUniqueViewers.get(slideId)!.add(viewerId);
      }
    }
    if (viewerId) {
      if (!viewerTimelines.has(viewerId)) {
        viewerTimelines.set(viewerId, []);
      }
      viewerTimelines.get(viewerId)!.push({
        slideId: slideId ?? "",
        createdAt: event.createdAt
      });
      if (slideId === firstSlideId) {
        firstSlideViewers.add(viewerId);
      }
    }
  }

  for (const events of viewerTimelines.values()) {
    events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const slideDurations = new Map<string, number[]>();
  for (const events of viewerTimelines.values()) {
    for (let index = 0; index < events.length - 1; index += 1) {
      const current = events[index];
      const next = events[index + 1];
      if (!current.slideId) continue;
      const delta = next.createdAt.getTime() - current.createdAt.getTime();
      if (delta <= 0) continue;
      if (!slideDurations.has(current.slideId)) {
        slideDurations.set(current.slideId, []);
      }
      slideDurations.get(current.slideId)!.push(delta);
    }
  }

  const baseline = firstSlideViewers.size > 0 ? firstSlideViewers.size : firstSlideViewCount;
  const percentFormatter = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0
  });

  const funnelRows = proposal.slides.map((slide, index) => {
    const viewCount = slideViewCounts.get(slide.id) ?? 0;
    const uniqueViewers = slideUniqueViewers.get(slide.id)?.size ?? 0;
    const numerator = uniqueViewers > 0 ? uniqueViewers : viewCount;
    const rate = baseline ? Math.min(numerator / baseline, 1) : 0;
    const durations = slideDurations.get(slide.id) ?? [];
    const averageDuration = durations.length
      ? durations.reduce((total, ms) => total + ms, 0) / durations.length
      : null;
    return {
      index,
      slide,
      viewCount,
      completionRate: rate,
      averageDuration
    };
  });

  const eventCounts = Object.values(EventType).reduce<Record<string, number>>((acc, type) => {
    acc[type] = proposal.events.filter((event) => event.type === type).length;
    return acc;
  }, {});

  const uniqueViewers = new Set(
    Array.from(slideUniqueViewers.values()).flatMap((set) => Array.from(set))
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Proposal funnel analytics</h1>
        <p className="text-sm text-muted-foreground">
          Tracking slide completion and dwell time for {proposal.client.name} · {proposal.title}.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total unique viewers</CardTitle>
            <CardDescription>Based on view events tagged with a viewer ID.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{uniqueViewers.size || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acceptances recorded</CardTitle>
            <CardDescription>Successful signature submissions for this proposal.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{eventCounts[EventType.ACCEPT] ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deposits paid</CardTitle>
            <CardDescription>Payments confirmed via Stripe checkout.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{eventCounts[EventType.PAY] ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Slide-by-slide completion</CardTitle>
          <CardDescription>
            Completion rate is relative to intro slide viewers; time on step uses consecutive view timestamps.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Step</th>
                <th className="px-4 py-3 font-semibold">Views</th>
                <th className="px-4 py-3 font-semibold">Completion</th>
                <th className="px-4 py-3 font-semibold">Avg. time on step</th>
              </tr>
            </thead>
            <tbody>
              {funnelRows.map((row) => (
                <tr key={row.slide.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      Step {row.index + 1}: {row.slide.title ?? row.slide.type.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs uppercase text-muted-foreground">{row.slide.type.toLowerCase()}</div>
                  </td>
                  <td className="px-4 py-3">{row.viewCount}</td>
                  <td className="px-4 py-3">
                    {baseline
                      ? percentFormatter.format(row.completionRate)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{row.averageDuration ? formatDuration(row.averageDuration) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event breakdown</CardTitle>
          <CardDescription>Raw counts captured during the interactive proposal journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(eventCounts).map(([type, count]) => (
              <div key={type} className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                <div className="text-xs uppercase text-muted-foreground">{type.toLowerCase().replace(/_/g, " ")}</div>
                <div className="text-lg font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
