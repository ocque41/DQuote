import { ClockIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardsProps {
  metrics: {
    sentLast30Days: number;
    sentChangePct?: number | null;
    winRatePct?: number | null;
    winRateDelta?: number | null;
    averageTurnaroundDays?: number | null;
    turnaroundDelta?: number | null;
    openPipeline: number;
    openDelta?: number | null;
  };
}

function formatPercent(value: number | null | undefined, suffix = "%") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)}${suffix}`;
}

function formatDays(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1)} days`;
}

export function SectionCards({ metrics }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Quotes sent (30d)</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {metrics.sentLast30Days}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {metrics.sentChangePct !== undefined && metrics.sentChangePct !== null
                ? `${metrics.sentChangePct >= 0 ? "+" : ""}${metrics.sentChangePct.toFixed(1)}%`
                : "—"}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Compared with the prior 30 days</div>
          <div className="text-muted-foreground">Counts proposals that moved beyond draft.</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Win rate</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatPercent(metrics.winRatePct)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              {metrics.winRateDelta !== undefined && metrics.winRateDelta !== null
                ? `${metrics.winRateDelta >= 0 ? "+" : ""}${metrics.winRateDelta.toFixed(1)} pts`
                : "—"}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Share of accepted outcomes</div>
          <div className="text-muted-foreground">Calculated from accepted vs. declined proposals.</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Average turnaround</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatDays(metrics.averageTurnaroundDays)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <ClockIcon className="size-3" />
              {metrics.turnaroundDelta !== undefined && metrics.turnaroundDelta !== null
                ? `${metrics.turnaroundDelta >= 0 ? "+" : ""}${metrics.turnaroundDelta.toFixed(1)}d`
                : "—"}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Median days from send to acceptance</div>
          <div className="text-muted-foreground">Only counts proposals with an acceptance timestamp.</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Open pipeline</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {metrics.openPipeline}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingDownIcon className="size-3" />
              {metrics.openDelta !== undefined && metrics.openDelta !== null
                ? `${metrics.openDelta >= 0 ? "+" : ""}${metrics.openDelta.toFixed(1)}%`
                : "—"}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Awaiting decision</div>
          <div className="text-muted-foreground">Includes SENT and VIEWED proposals.</div>
        </CardFooter>
      </Card>
    </div>
  );
}
