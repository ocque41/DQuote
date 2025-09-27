"use client";

import { type Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  align?: "left" | "right" | "center";
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  align = "left",
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className="text-sm font-medium text-muted-foreground">{title}</span>;
  }

  const sortDirection = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-2 h-8 px-2 text-sm font-medium",
        align === "right" && "ml-auto",
        align === "center" && "mx-auto"
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span className={cn(align === "right" && "mr-2", align !== "right" && "mr-2")}>{title}</span>
      {sortDirection === "asc" ? (
        <ArrowUpIcon className="size-3.5" />
      ) : sortDirection === "desc" ? (
        <ArrowDownIcon className="size-3.5" />
      ) : (
        <ChevronsUpDownIcon className="size-3.5 opacity-50" />
      )}
    </Button>
  );
}
