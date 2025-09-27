import { redirect } from "next/navigation";
import { requireUser } from "@/auth/requireUser";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  mainNavigation,
  resourceNavigation,
  secondaryNavigation,
} from "@/lib/navigation";
import { getViewerContext } from "@/server/auth";

import data from "./data.json";

export default async function DashboardPage() {
  const session = await requireUser({ returnTo: "/dashboard" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/login?redirect=/dashboard");
  }

  const userName = viewer.sessionUser.name ?? viewer.sessionUser.email;
  const userEmail = viewer.sessionUser.email;

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        orgName={viewer.org.name}
        navMain={mainNavigation}
        resources={resourceNavigation}
        navSecondary={secondaryNavigation}
        user={{ name: userName, email: userEmail }}
      />
      <SidebarInset className="bg-muted/20">
        <SiteHeader
          title="Pipeline overview"
          subtitle="Track quote velocity, conversion, and collaboration health."
          orgName={viewer.org.name}
        />
        <div className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10">
          <SectionCards />
          <ChartAreaInteractive />
          <div className="border-border/70 bg-card/95 rounded-2xl border p-2 shadow-sm sm:p-4">
            <DataTable data={data} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
