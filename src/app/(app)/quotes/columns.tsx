"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

import type { Quote } from "@/app/quotes/schema";
import { QuoteActions } from "@/components/quote-actions";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatChange(changePct: number) {
  if (changePct > 0) {
    return `+${changePct.toFixed(2)}%`;
  }

  if (changePct < 0) {
    return `${changePct.toFixed(2)}%`;
  }

  return "0.00%";
}

export type QuoteColumnMeta = {
  onPinToggle?: (quoteId: string) => void;
  onRemove?: (quoteId: string) => void;
};

export const columns: ColumnDef<Quote, unknown>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="px-1">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="px-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select quote ${row.original.symbol}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="font-semibold uppercase">
        {row.original.symbol}
      </Badge>
    ),
    sortingFn: "text",
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="text-foreground font-medium">{row.original.name}</p>
        <p className="text-muted-foreground text-xs">
          {currencyFormatter.format(row.original.last)} last
        </p>
      </div>
    ),
  },
  {
    accessorKey: "bid",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bid" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {currencyFormatter.format(row.original.bid)}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "ask",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ask" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {currencyFormatter.format(row.original.ask)}
      </div>
    ),
  },
  {
    accessorKey: "last",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last" align="right" />
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {currencyFormatter.format(row.original.last)}
      </div>
    ),
  },
  {
    accessorKey: "changePct",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Change" align="right" />
    ),
    cell: ({ row }) => {
      const value = row.original.changePct;
      const Icon =
        value > 0 ? ArrowUpIcon : value < 0 ? ArrowDownIcon : MinusIcon;
      return (
        <div
          className={cn(
            "flex items-center justify-end gap-1 tabular-nums",
            value > 0 && "text-emerald-600 dark:text-emerald-400",
            value < 0 && "text-red-500 dark:text-red-400",
          )}
        >
          <Icon className="size-3" />
          {formatChange(value)}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (value === "gainers") {
        return row.original.changePct > 0;
      }
      if (value === "losers") {
        return row.original.changePct < 0;
      }
      return true;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      return (
        <time
          dateTime={row.original.updatedAt.toISOString()}
          className="text-muted-foreground text-sm"
        >
          {row.original.updatedAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      );
    },
    sortingFn: (rowA, rowB) =>
      new Date(rowA.original.updatedAt).getTime() -
      new Date(rowB.original.updatedAt).getTime(),
  },
  {
    accessorKey: "pinned",
    header: () => null,
    cell: () => null,
    filterFn: (row, id, value) => {
      if (value === true) {
        return row.original.pinned;
      }
      return true;
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as QuoteColumnMeta | undefined;
      return (
        <QuoteActions
          quote={row.original}
          onPinToggle={meta?.onPinToggle}
          onRemove={meta?.onRemove}
        />
      );
    },
  },
];
