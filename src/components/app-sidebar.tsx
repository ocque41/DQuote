"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowUpCircleIcon } from "lucide-react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SidebarIconName } from "@/lib/navigation";

type SidebarNavItem = {
  title: string;
  href: string;
  icon?: SidebarIconName;
};

type SidebarResource = {
  name: string;
  href: string;
  icon: SidebarIconName;
};

type SidebarSecondaryNavItem = {
  title: string;
  href: string;
  icon: SidebarIconName;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  orgName: string;
  navMain: ReadonlyArray<SidebarNavItem>;
  navSecondary: ReadonlyArray<SidebarSecondaryNavItem>;
  resources: ReadonlyArray<SidebarResource>;
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AppSidebar({
  orgName,
  navMain,
  navSecondary,
  resources,
  user,
  className,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className={cn("bg-sidebar", className)}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={orgName}
              size="lg"
            >
              <Link href="/dashboard">
                <ArrowUpCircleIcon />
                <span className="text-base font-semibold truncate">{orgName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-0">
        <NavMain items={navMain} />
        <NavDocuments items={resources} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser name={user.name ?? null} email={user.email ?? null} />
      </SidebarFooter>
    </Sidebar>
  );
}
