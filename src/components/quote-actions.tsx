"use client";

import * as React from "react";
import Link from "next/link";
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
import { MoreHorizontalIcon, ExternalLinkIcon, CopyIcon } from "lucide-react";

import type { Quote } from "@/app/app/(authenticated)/quotes/schema";

interface QuoteActionsProps {
  quote: Quote;
  onRemove?: (quoteId: string) => void;
}

export function QuoteActions({ quote, onRemove }: QuoteActionsProps) {
  const shareUrl = `/proposals/${quote.shareId}`;
  const fullUrl = `${window.location.origin}${shareUrl}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{quote.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={shareUrl} target="_blank">
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            View Proposal
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(fullUrl);
            toast("Link copied", {
              description: "Share link copied to clipboard",
            });
          }}
        >
          <CopyIcon className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        {onRemove && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                onRemove(quote.id);
                toast("Quote removed", {
                  description: `${quote.title} removed`,
                });
              }}
            >
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
