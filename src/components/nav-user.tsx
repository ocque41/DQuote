"use client";

import { UserButton } from "@stackframe/stack";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavUser({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  const displayName = name ?? email ?? "Account";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild className="w-full">
          <div className="flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-sidebar px-3 py-2">
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium">{displayName}</span>
              {email ? <span className="text-xs text-muted-foreground">{email}</span> : null}
            </div>
            <UserButton />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
