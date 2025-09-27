import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  mainNavigation,
  resourceNavigation,
  secondaryNavigation,
} from "@/lib/navigation";
import { getViewerContext } from "@/server/auth";
import { listQuotes } from "@/lib/data/quotes";

import { QuotesDataTable } from "./data-table";
import { quoteSchema } from "./schema";

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
    redirect("/login?redirect=/quotes");
  }

  const rawQuotes = await listQuotes({ orgId: viewer.org.id });
  const quotes = rawQuotes.map((quote) => quoteSchema.parse(quote));

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        orgName={viewer.org.name}
        navMain={mainNavigation}
        resources={resourceNavigation}
        navSecondary={secondaryNavigation}
        user={{
          name: viewer.sessionUser.name,
          email: viewer.sessionUser.email,
        }}
      />
      <SidebarInset className="bg-muted/20">
        <SiteHeader
          title="Quote Terminal"
          subtitle="Monitor bid/ask spreads, pin focus tickers, and export sheets for ops."
          orgName={viewer.org.name}
        />
        <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10">
          <div className="border-border/70 bg-card/95 rounded-2xl border p-2 shadow-sm sm:p-4">
            <QuotesDataTable data={quotes} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
