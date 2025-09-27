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

type SidebarNavItem = {
  title: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type SidebarResource = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  orgName: string;
  navMain: SidebarNavItem[];
  navSecondary: SidebarNavItem[];
  resources: SidebarResource[];
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AppSidebar({ orgName, navMain, navSecondary, resources, user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">{orgName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
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
