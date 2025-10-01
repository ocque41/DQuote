"use client";

import { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarMobileToggle } from "@/components/sidebar-mobile-toggle";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { mainNavigation, resourceNavigation, secondaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import type { ViewerContext } from "@/server/auth";

interface AppShellProps {
  viewer: ViewerContext;
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentClassName?: string;
}

export function AppShell({
  viewer,
  title,
  subtitle,
  children,
  contentClassName,
}: AppShellProps) {
  return (
    <SidebarProvider className="min-h-dvh flex flex-col lg:grid lg:grid-cols-[var(--sidebar-width)_1fr] xl:grid-cols-[18rem_1fr]">
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
      <SidebarInset className="bg-muted/20 min-w-0 flex flex-col">
        <SiteHeader title={title} subtitle={subtitle} orgName={viewer.org.name} />
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 xl:px-8 2xl:px-10 3xl:px-12 max-w-[min(100%,theme(screens.4xl))]",
            contentClassName,
          )}
        >
          {children}
        </div>
      </SidebarInset>
      <SidebarMobileToggle />
    </SidebarProvider>
  );
}
