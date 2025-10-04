"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ExternalLinkIcon, MoreHorizontalIcon, CopyIcon } from "lucide-react";

import type { Quote } from "@/app/app/(authenticated)/quotes/schema";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SENT: "default",
  ACCEPTED: "default",
  EXPIRED: "destructive",
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
          aria-label={`Select quote ${row.original.title}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quote Title" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <p className="font-medium truncate">{row.original.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {row.original.clientName}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant={statusColorMap[row.original.status] || "outline"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <time
        dateTime={row.original.createdAt.toISOString()}
        className="text-sm text-muted-foreground"
      >
        {row.original.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
    ),
    sortingFn: (rowA, rowB) =>
      rowA.original.createdAt.getTime() - rowB.original.createdAt.getTime(),
  },
  {
    accessorKey: "shareId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Share Link" />
    ),
    cell: ({ row }) => {
      const shareUrl = `${window.location.origin}/proposals/${row.original.shareId}`;
      return (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {row.original.shareId.slice(0, 8)}...
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
            }}
            title="Copy share link"
          >
            <CopyIcon className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const shareUrl = `/proposals/${row.original.shareId}`;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontalIcon className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={shareUrl} target="_blank">
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                View Proposal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}${shareUrl}`
                );
              }}
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
