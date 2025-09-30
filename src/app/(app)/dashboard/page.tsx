import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
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

  let viewer: Awaited<ReturnType<typeof getViewerContext>> = null;
  let schemaMissing = false;
  let databaseError = false;
  let errorMessage = "";

  try {
    viewer = await getViewerContext(session.user);
  } catch (error) {
    console.error("Dashboard error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      schemaMissing = true;
      console.error(
        "Dashboard OrgMember lookup failed because migrations have not been applied. Run `prisma migrate deploy` against the production database and redeploy.",
        error
      );
    } else if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError ||
      (error instanceof Error && error.message.includes("database server"))
    ) {
      databaseError = true;
      errorMessage = error instanceof Error ? error.message : "Database connection failed";
      console.error("Database connection error:", error);
    } else {
      // For any other errors, still show a user-friendly message instead of crashing
      databaseError = true;
      errorMessage = "An unexpected error occurred while loading dashboard data";
      console.error("Unexpected dashboard error:", error);
    }
  }

  if (schemaMissing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Database migrations required</h1>
        <p className="text-muted-foreground max-w-2xl">
          The dashboard needs the <code>OrgMember</code> table before it can load.
          Deploy the latest Prisma migrations to your Neon production database by
          running <code>prisma migrate deploy</code> (ensure Vercel&apos;s
          <code>DATABASE_URL</code> targets the correct branch) and redeploy this
          app.
        </p>
      </div>
    );
  }

  if (databaseError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Database connection issue</h1>
        <p className="text-muted-foreground max-w-2xl">
          We&apos;re having trouble connecting to the database. This might be a temporary issue.
          Please try refreshing the page in a few moments.
        </p>
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Technical details</summary>
          <p className="mt-2 font-mono text-xs">{errorMessage}</p>
        </details>
      </div>
    );
  }

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
        <div className="flex flex-1 flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 lg:gap-8 lg:px-10">
          <SectionCards />
          <ChartAreaInteractive />
          <div className="border-border/70 bg-card/95 rounded-lg border p-2 shadow-sm sm:rounded-2xl sm:p-4">
            <DataTable data={data} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
