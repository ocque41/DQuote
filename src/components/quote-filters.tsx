"use client";

import * as React from "react";
import { type Table } from "@tanstack/react-table";
import { DownloadIcon, PlusCircleIcon, SearchIcon, XIcon } from "lucide-react";

import type { Quote } from "@/app/(app)/quotes/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuoteFiltersProps {
  table: Table<Quote>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onExport: () => void;
}

function isFiltered(table: Table<Quote>) {
  const hasColumnFilters = table.getState().columnFilters.length > 0;
  const globalFilter = table.getState().globalFilter;
  const hasGlobalFilter = typeof globalFilter === "string" && globalFilter.length > 0;

  return hasColumnFilters || hasGlobalFilter;
}

export function QuoteFilters({ table, searchValue, onSearchChange, onCreate, onExport }: QuoteFiltersProps) {
  const clearFilters = React.useCallback(() => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
  }, [table]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search quotes by title or client"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
          />
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        </div>
        {isFiltered(table) ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Reset
            <XIcon className="ml-1 size-3.5" />
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExport}>
          <DownloadIcon className="mr-2 size-4" />
          Export CSV
        </Button>
        <Button size="sm" onClick={onCreate}>
          <PlusCircleIcon className="mr-2 size-4" />
          New Quote
        </Button>
      </div>
    </div>
  );
}
