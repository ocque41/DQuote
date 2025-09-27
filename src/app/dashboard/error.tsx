"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard failed to load", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          We couldn’t load your dashboard data. Try again or refresh the page.
        </p>
      </div>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
