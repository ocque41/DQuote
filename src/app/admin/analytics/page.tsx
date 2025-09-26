import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      proposal: { select: { title: true, shareId: true } }
    }
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Engagement analytics</h1>
        <p className="text-sm text-muted-foreground">Latest viewer activity across your proposals.</p>
      </header>
      <div className="overflow-hidden rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Proposal</th>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="px-4 py-3 capitalize">{event.type}</td>
                <td className="px-4 py-3">
                  {event.proposal.title}
                  <span className="ml-2 text-xs text-muted-foreground">/proposals/{event.proposal.shareId}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{event.createdAt.toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
