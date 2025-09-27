"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoreHorizontalIcon, PinIcon } from "lucide-react";

import type { Quote } from "@/app/quotes/schema";

interface QuoteActionsProps {
  quote: Quote;
  onPinToggle?: (quoteId: string) => void;
  onRemove?: (quoteId: string) => void;
}

export function QuoteActions({ quote, onPinToggle, onRemove }: QuoteActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{quote.symbol}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            toast("Viewing quote", {
              description: `${quote.name} — last ${quote.last.toFixed(2)}`,
            })
          }
        >
          View details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const nextPinned = !quote.pinned;
            onPinToggle?.(quote.id);
            toast(nextPinned ? "Quote pinned" : "Quote unpinned", {
              description: `${quote.symbol} ${nextPinned ? "added" : "removed"} from your focus list`,
              icon: <PinIcon className="size-3" />,
            });
          }}
        >
          {quote.pinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            onRemove?.(quote.id);
            toast("Quote removed", {
              description: `${quote.name} hidden from the terminal`,
            });
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
