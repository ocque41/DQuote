import { Building2Icon } from "lucide-react";

import { UserButton } from "@stackframe/stack";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface SiteHeaderProps {
  title: string;
  subtitle?: string;
  orgName?: string;
}

export function SiteHeader({ title, subtitle, orgName }: SiteHeaderProps) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-3 px-4 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex flex-1 flex-col">
          <h1 className="text-base font-semibold leading-tight text-foreground">{title}</h1>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden items-center gap-2 rounded-full sm:flex">
            <Building2Icon className="size-4" />
            <span className="text-xs font-medium">{orgName ?? "Switch org"}</span>
          </Button>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
