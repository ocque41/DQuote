import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { getViewerContext } from "@/server/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarMobileToggle } from "@/components/sidebar-mobile-toggle";

const navLinks = [
  { href: "/app", title: "Overview", icon: "layout-dashboard" as const },
  { href: "/app/proposals", title: "Proposals", icon: "file-text" as const },
  { href: "/admin/analytics", title: "Analytics", icon: "bar-chart-3" as const }
];

const resourceLinks = [
  { name: "Documentation", href: "#", icon: "notebook-pen" as const },
  { name: "Support", href: "#", icon: "help-circle" as const }
];

const secondaryLinks = [
  { title: "Settings", href: "/app/settings", icon: "settings" as const },
  { title: "Help", href: "#", icon: "help-circle" as const }
];

export default async function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/handler/sign-in");
  }

  const displayName = viewer.orgUser.name ?? viewer.sessionUser.email ?? "Account";

  return (
    <SidebarProvider>
      <AppSidebar
        orgName={viewer.org.name}
        navMain={navLinks}
        navSecondary={secondaryLinks}
        resources={resourceLinks}
        user={{
          name: displayName,
          email: viewer.sessionUser.email
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/90 backdrop-blur">
          <div className="flex flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <Link href="/" className="text-xl font-semibold">
              DQuote
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
      <SidebarMobileToggle />
    </SidebarProvider>
  );
}
