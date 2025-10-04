"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ExternalLink, Filter, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["ALL", "DRAFT", "SENT", "VIEWED", "ACCEPTED", "DECLINED", "EXPIRED"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type PipelineRow = {
  id: string;
  title: string;
  clientName: string;
  clientCompany?: string | null;
  status: string;
  value: number | null;
  currency: string;
  updatedAt: string;
  shareId: string;
};

interface DataTableProps {
  rows: PipelineRow[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
  VIEWED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  DECLINED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
};

function formatCurrency(value: number | null, currency: string) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatRelative(date: string) {
  try {
    return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function DataTable({ rows }: DataTableProps) {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "ALL" && row.status !== status) {
        return false;
      }
      if (!term) return true;

      const haystack = [row.title, row.clientName, row.clientCompany ?? "", row.status]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [rows, status, search]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center text-muted-foreground">
        <Filter className="mb-3 h-10 w-10" aria-hidden="true" />
        <p className="mb-1 text-lg font-semibold text-foreground">No pipeline activity yet</p>
        <p className="text-sm">Create and send a quote to populate this dashboard table.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:inline-flex">
            {STATUS_FILTERS.map((option) => (
              <TabsTrigger key={option} value={option} className="text-xs">
                {option === "ALL" ? "All" : option.toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title or client"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/95 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead className="min-w-[200px]">Proposal</TableHead>
              <TableHead className="min-w-[160px]">Client</TableHead>
              <TableHead className="w-[140px] text-right">Value</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[160px]">Updated</TableHead>
              <TableHead className="w-[80px] text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="text-sm">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{row.title}</span>
                    <span className="text-xs text-muted-foreground">Share ID: {row.shareId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{row.clientName}</span>
                    {row.clientCompany && (
                      <span className="text-xs text-muted-foreground">{row.clientCompany}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(row.value, row.currency)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "capitalize",
                      STATUS_COLORS[row.status] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {row.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{formatRelative(row.updatedAt)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/proposals/${row.shareId}`} className="text-primary">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Open proposal</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
