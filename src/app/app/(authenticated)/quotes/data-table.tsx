"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { Quote } from "@/app/app/(authenticated)/quotes/schema";
import { columns } from "@/app/app/(authenticated)/quotes/columns";
import { QuoteFilters } from "@/components/quote-filters";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function exportToCsv(rows: Quote[]) {
  const header = [
    "Title",
    "Client Name",
    "Status",
    "Share ID",
    "Created At",
  ];
  const csv = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.title,
        row.clientName,
        row.status,
        row.shareId,
        row.createdAt.toISOString(),
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `quotes-${new Date().toISOString()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

interface QuotesDataTableProps {
  data: Quote[];
}

export function QuotesDataTable({ data }: QuotesDataTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      if (typeof filterValue !== "string" || filterValue.trim() === "") {
        return true;
      }
      const search = filterValue.toLowerCase();
      return (
        row.original.title.toLowerCase().includes(search) ||
        row.original.clientName.toLowerCase().includes(search)
      );
    },
  });

  function handleExport() {
    const rowsToExport = table.getFilteredSelectedRowModel().rows.length
      ? table.getFilteredSelectedRowModel().rows.map((row) => row.original)
      : table.getFilteredRowModel().rows.map((row) => row.original);
    exportToCsv(rowsToExport);
  }

  return (
    <div className="space-y-4">
      <QuoteFilters
        table={table}
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onCreate={() => router.push("/app/quotes/new")}
        onExport={handleExport}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(header.column.id === "select" && "w-12")}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  No quotes match your filters yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <div>
          Showing {table.getPaginationRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} quotes
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
