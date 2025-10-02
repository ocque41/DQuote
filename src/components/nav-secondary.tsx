"use client";

import Link from "next/link";
import * as React from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getSidebarIcon } from "@/components/sidebar-icons";
import type { SidebarIconName } from "@/lib/navigation";

export function NavSecondary({
  items,
  ...props
}: {
  items: ReadonlyArray<{
    title: string;
    href: string;
    icon: SidebarIconName;
  }>;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = getSidebarIcon(item.icon);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
