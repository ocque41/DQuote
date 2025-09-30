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

import type { Quote } from "@/app/(app)/quotes/schema";
import { columns } from "@/app/(app)/quotes/columns";
import { QuoteFilters } from "@/components/quote-filters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    "Symbol",
    "Name",
    "Bid",
    "Ask",
    "Last",
    "Change %",
    "Updated At",
  ];
  const csv = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.symbol,
        row.name,
        row.bid.toFixed(2),
        row.ask.toFixed(2),
        row.last.toFixed(2),
        row.changePct.toFixed(2),
        row.updatedAt.toISOString(),
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
  const [tableData, setTableData] = React.useState(() => data);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [formState, setFormState] = React.useState({
    symbol: "",
    name: "",
    bid: "",
    ask: "",
    last: "",
    changePct: "",
  });

  const table = useReactTable({
    data: tableData,
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
        row.original.symbol.toLowerCase().includes(search) ||
        row.original.name.toLowerCase().includes(search)
      );
    },
    meta: {
      onPinToggle: (quoteId: string) => {
        setTableData((rows) =>
          rows.map((row) =>
            row.id === quoteId
              ? {
                  ...row,
                  pinned: !row.pinned,
                }
              : row,
          ),
        );
      },
      onRemove: (quoteId: string) => {
        setTableData((rows) => rows.filter((row) => row.id !== quoteId));
      },
    },
    initialState: {
      columnVisibility: {
        pinned: false,
      },
    },
  });

  function handleExport() {
    const rowsToExport = table.getFilteredSelectedRowModel().rows.length
      ? table.getFilteredSelectedRowModel().rows.map((row) => row.original)
      : table.getFilteredRowModel().rows.map((row) => row.original);
    exportToCsv(rowsToExport);
  }

  function handleCreateQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bid = Number(formState.bid);
    const ask = Number(formState.ask);
    const last = Number(formState.last);
    const changePct = Number(formState.changePct);

    if (
      !formState.symbol ||
      !formState.name ||
      Number.isNaN(bid) ||
      Number.isNaN(ask) ||
      Number.isNaN(last)
    ) {
      return;
    }

    setTableData((rows) => [
      {
        id: crypto.randomUUID(),
        symbol: formState.symbol.toUpperCase(),
        name: formState.name,
        bid,
        ask,
        last,
        changePct: Number.isNaN(changePct) ? 0 : changePct,
        updatedAt: new Date(),
        pinned: false,
      },
      ...rows,
    ]);

    setFormState({
      symbol: "",
      name: "",
      bid: "",
      ask: "",
      last: "",
      changePct: "",
    });
    setIsCreateOpen(false);
  }

  return (
    <div className="space-y-4">
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <QuoteFilters
          table={table}
          searchValue={globalFilter}
          onSearchChange={setGlobalFilter}
          onCreate={() => router.push("/quotes/new")}
          onExport={handleExport}
        />
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New quote</SheetTitle>
            <SheetDescription>
              Add a ticker to track in the terminal.
            </SheetDescription>
          </SheetHeader>
          <form className="grid gap-4 py-4" onSubmit={handleCreateQuote}>
            <div className="grid gap-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={formState.symbol}
                onChange={(event) =>
                  setFormState((state) => ({
                    ...state,
                    symbol: event.target.value,
                  }))
                }
                placeholder="DQT"
                autoCapitalize="characters"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((state) => ({
                    ...state,
                    name: event.target.value,
                  }))
                }
                placeholder="DQuote Holdings"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="bid">Bid</Label>
                <Input
                  id="bid"
                  value={formState.bid}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      bid: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="121.12"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ask">Ask</Label>
                <Input
                  id="ask"
                  value={formState.ask}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      ask: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="121.78"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last">Last</Label>
                <Input
                  id="last"
                  value={formState.last}
                  onChange={(event) =>
                    setFormState((state) => ({
                      ...state,
                      last: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="121.45"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="changePct">Change %</Label>
              <Input
                id="changePct"
                value={formState.changePct}
                onChange={(event) =>
                  setFormState((state) => ({
                    ...state,
                    changePct: event.target.value,
                  }))
                }
                inputMode="decimal"
                placeholder="1.25"
              />
            </div>
            <SheetFooter>
              <Button type="submit">Add quote</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
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
