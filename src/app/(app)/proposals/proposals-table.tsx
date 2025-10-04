"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ExternalLink, Filter, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUS_ORDER = ["ALL", "DRAFT", "SENT", "VIEWED", "ACCEPTED", "DECLINED", "EXPIRED"] as const;

type StatusFilter = (typeof STATUS_ORDER)[number];

type ProposalRow = {
  id: string;
  shareId: string;
  title: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  expiresAt: string | null;
  client: {
    name: string;
    company: string | null;
  };
  value: number | null;
  currency: string;
};

const STATUS_BADGE_VARIANT: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
  VIEWED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  DECLINED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
};

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Last activity" },
  { value: "value", label: "Deal value" },
  { value: "createdAt", label: "Created date" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

interface ProposalsTableProps {
  proposals: ProposalRow[];
}

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

export function ProposalsTable({ proposals }: ProposalsTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return proposals
      .filter((proposal) => {
        if (statusFilter !== "ALL" && proposal.status !== statusFilter) {
          return false;
        }

        if (!normalizedSearch) return true;

        const haystack = [
          proposal.title,
          proposal.client.name,
          proposal.client.company ?? "",
          proposal.shareId,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sortKey === "value") {
          const aValue = a.value ?? 0;
          const bValue = b.value ?? 0;
          return bValue - aValue;
        }

        const dateA = new Date(a[sortKey]).getTime();
        const dateB = new Date(b[sortKey]).getTime();
        return dateB - dateA;
      });
  }, [proposals, statusFilter, sortKey, search]);

  const totalCount = proposals.length;
  const showEmptyState = totalCount === 0;
  const filteredEmpty = !showEmptyState && filtered.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Filter by status</Label>
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 sm:inline-flex">
              {STATUS_ORDER.map((status) => (
                <TabsTrigger key={status} value={status} className="text-xs">
                  {status === "ALL" ? "All" : status.toLowerCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or client"
              className="pl-9"
            />
          </div>
          <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 p-10 text-center text-muted-foreground">
          <Filter className="mb-3 h-10 w-10" aria-hidden="true" />
          <p className="mb-1 text-lg font-semibold text-foreground">No proposals yet</p>
          <p className="text-sm">
            Create a quote to generate your first interactive proposal and track it here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/quotes/new">Start a quote</Link>
          </Button>
        </div>
      ) : filteredEmpty ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          No proposals match your current filters. Try a different status or clear the search.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/90 shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                <TableHead className="min-w-[220px]">Proposal</TableHead>
                <TableHead className="min-w-[160px]">Client</TableHead>
                <TableHead className="w-[140px] text-right">Value</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[160px]">Last activity</TableHead>
                <TableHead className="w-[80px] text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((proposal) => (
                <TableRow key={proposal.id} className="text-sm">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{proposal.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Created {format(new Date(proposal.createdAt), "dd MMM yyyy")}
                        {proposal.expiresAt ? ` · Expires ${format(new Date(proposal.expiresAt), "dd MMM")}` : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{proposal.client.name}</span>
                      {proposal.client.company && (
                        <span className="text-xs text-muted-foreground">{proposal.client.company}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(proposal.value, proposal.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize",
                        STATUS_BADGE_VARIANT[proposal.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {proposal.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatRelative(proposal.updatedAt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/proposals/${proposal.shareId}`} className="text-primary">
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
      )}
    </div>
  );
}
