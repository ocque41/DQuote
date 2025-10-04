import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { getViewerContext } from "@/server/auth";
import { listQuotes } from "@/lib/data/quotes";

import { QuotesDataTable } from "./data-table";
import { quoteSchema, type Quote } from "./schema";

export const metadata: Metadata = {
  title: "Quote Terminal | DQuote",
};

export default async function QuotesPage() {
  const session = await requireUser({ returnTo: "/quotes" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/handler/sign-in?redirect=/quotes");
  }

  let quotes: Quote[] = [];
  let databaseError = false;

  try {
    const rawQuotes = await listQuotes({ orgId: viewer.org.id });
    quotes = rawQuotes.map((quote) => quoteSchema.parse(quote));
  } catch (error) {
    console.error("Quotes page database error:", error);
    databaseError = true;
  }

  if (databaseError) {
    return (
      <AppShell
        viewer={viewer}
        title="Quote Terminal"
        subtitle="Monitor bid/ask spreads, pin focus tickers, and export sheets for ops."
        contentClassName="items-center justify-center gap-4 text-center"
      >
        <h1 className="text-2xl font-semibold">Database connection issue</h1>
        <p className="max-w-2xl text-muted-foreground">
          We&apos;re having trouble loading your quotes. Please try refreshing the page.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      viewer={viewer}
      title="Quote Terminal"
      subtitle="Monitor bid/ask spreads, pin focus tickers, and export sheets for ops."
    >
      <div className="rounded-lg border border-border/70 bg-card/95 p-2 shadow-sm sm:rounded-2xl sm:p-4">
        <QuotesDataTable data={quotes} />
      </div>
    </AppShell>
  );
}
