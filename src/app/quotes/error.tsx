"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function QuotesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Quotes terminal failed to load", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Unable to load quotes</h1>
        <p className="text-sm text-muted-foreground">
          Check your connection or refresh to try again.
        </p>
      </div>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
