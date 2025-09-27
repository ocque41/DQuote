"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/components/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

const chartData = [
  { date: "2024-04-01", sent: 222, accepted: 150 },
  { date: "2024-04-02", sent: 97, accepted: 180 },
  { date: "2024-04-03", sent: 167, accepted: 120 },
  { date: "2024-04-04", sent: 242, accepted: 260 },
  { date: "2024-04-05", sent: 373, accepted: 290 },
  { date: "2024-04-06", sent: 301, accepted: 340 },
  { date: "2024-04-07", sent: 245, accepted: 180 },
  { date: "2024-04-08", sent: 409, accepted: 320 },
  { date: "2024-04-09", sent: 59, accepted: 110 },
  { date: "2024-04-10", sent: 261, accepted: 190 },
  { date: "2024-04-11", sent: 327, accepted: 350 },
  { date: "2024-04-12", sent: 292, accepted: 210 },
  { date: "2024-04-13", sent: 342, accepted: 380 },
  { date: "2024-04-14", sent: 137, accepted: 220 },
  { date: "2024-04-15", sent: 120, accepted: 170 },
  { date: "2024-04-16", sent: 138, accepted: 190 },
  { date: "2024-04-17", sent: 446, accepted: 360 },
  { date: "2024-04-18", sent: 364, accepted: 410 },
  { date: "2024-04-19", sent: 243, accepted: 180 },
  { date: "2024-04-20", sent: 89, accepted: 150 },
  { date: "2024-04-21", sent: 137, accepted: 200 },
  { date: "2024-04-22", sent: 224, accepted: 170 },
  { date: "2024-04-23", sent: 138, accepted: 230 },
  { date: "2024-04-24", sent: 387, accepted: 290 },
  { date: "2024-04-25", sent: 215, accepted: 250 },
  { date: "2024-04-26", sent: 75, accepted: 130 },
  { date: "2024-04-27", sent: 383, accepted: 420 },
  { date: "2024-04-28", sent: 122, accepted: 180 },
  { date: "2024-04-29", sent: 315, accepted: 240 },
  { date: "2024-04-30", sent: 454, accepted: 380 },
  { date: "2024-05-01", sent: 165, accepted: 220 },
  { date: "2024-05-02", sent: 293, accepted: 310 },
  { date: "2024-05-03", sent: 247, accepted: 190 },
  { date: "2024-05-04", sent: 385, accepted: 420 },
  { date: "2024-05-05", sent: 481, accepted: 390 },
  { date: "2024-05-06", sent: 498, accepted: 520 },
  { date: "2024-05-07", sent: 388, accepted: 300 },
  { date: "2024-05-08", sent: 149, accepted: 210 },
  { date: "2024-05-09", sent: 227, accepted: 180 },
  { date: "2024-05-10", sent: 293, accepted: 330 },
  { date: "2024-05-11", sent: 335, accepted: 270 },
  { date: "2024-05-12", sent: 197, accepted: 240 },
  { date: "2024-05-13", sent: 197, accepted: 160 },
  { date: "2024-05-14", sent: 448, accepted: 490 },
  { date: "2024-05-15", sent: 473, accepted: 380 },
  { date: "2024-05-16", sent: 338, accepted: 400 },
  { date: "2024-05-17", sent: 499, accepted: 420 },
  { date: "2024-05-18", sent: 315, accepted: 350 },
  { date: "2024-05-19", sent: 235, accepted: 180 },
  { date: "2024-05-20", sent: 177, accepted: 230 },
  { date: "2024-05-21", sent: 82, accepted: 140 },
  { date: "2024-05-22", sent: 81, accepted: 120 },
  { date: "2024-05-23", sent: 252, accepted: 290 },
  { date: "2024-05-24", sent: 294, accepted: 220 },
  { date: "2024-05-25", sent: 201, accepted: 250 },
  { date: "2024-05-26", sent: 213, accepted: 170 },
  { date: "2024-05-27", sent: 420, accepted: 460 },
  { date: "2024-05-28", sent: 233, accepted: 190 },
  { date: "2024-05-29", sent: 78, accepted: 130 },
  { date: "2024-05-30", sent: 340, accepted: 280 },
  { date: "2024-05-31", sent: 178, accepted: 230 },
  { date: "2024-06-01", sent: 178, accepted: 200 },
  { date: "2024-06-02", sent: 470, accepted: 410 },
  { date: "2024-06-03", sent: 103, accepted: 160 },
  { date: "2024-06-04", sent: 439, accepted: 380 },
  { date: "2024-06-05", sent: 88, accepted: 140 },
  { date: "2024-06-06", sent: 294, accepted: 250 },
  { date: "2024-06-07", sent: 323, accepted: 370 },
  { date: "2024-06-08", sent: 385, accepted: 320 },
  { date: "2024-06-09", sent: 438, accepted: 480 },
  { date: "2024-06-10", sent: 155, accepted: 200 },
  { date: "2024-06-11", sent: 92, accepted: 150 },
  { date: "2024-06-12", sent: 492, accepted: 420 },
  { date: "2024-06-13", sent: 81, accepted: 130 },
  { date: "2024-06-14", sent: 426, accepted: 380 },
  { date: "2024-06-15", sent: 307, accepted: 350 },
  { date: "2024-06-16", sent: 371, accepted: 310 },
  { date: "2024-06-17", sent: 475, accepted: 520 },
  { date: "2024-06-18", sent: 107, accepted: 170 },
  { date: "2024-06-19", sent: 341, accepted: 290 },
  { date: "2024-06-20", sent: 408, accepted: 450 },
  { date: "2024-06-21", sent: 169, accepted: 210 },
  { date: "2024-06-22", sent: 317, accepted: 270 },
  { date: "2024-06-23", sent: 480, accepted: 530 },
  { date: "2024-06-24", sent: 132, accepted: 180 },
  { date: "2024-06-25", sent: 141, accepted: 190 },
  { date: "2024-06-26", sent: 434, accepted: 380 },
  { date: "2024-06-27", sent: 448, accepted: 490 },
  { date: "2024-06-28", sent: 149, accepted: 200 },
  { date: "2024-06-29", sent: 103, accepted: 160 },
  { date: "2024-06-30", sent: 446, accepted: 400 },
];

const chartConfig = {
  sent: {
    label: "Quotes sent",
    color: "hsl(var(--chart-1))",
  },
  accepted: {
    label: "Quotes accepted",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Quote volume</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Sent vs. accepted in the selected window
          </span>
          <span className="@[540px]/card:hidden">Selected period</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sent)"
                  stopOpacity={1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sent)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAccepted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-accepted)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-accepted)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="accepted"
              type="natural"
              fill="url(#fillAccepted)"
              stroke="var(--color-accepted)"
              stackId="a"
            />
            <Area
              dataKey="sent"
              type="natural"
              fill="url(#fillSent)"
              stroke="var(--color-sent)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
