"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarMobileToggle() {
  const { isMobile, openMobile, toggleSidebar } = useSidebar();

  if (!isMobile) return null;

  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        "fixed bottom-4 left-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden",
        "hover:scale-110 transition-transform duration-200",
        "bg-primary hover:bg-primary/90"
      )}
      onClick={toggleSidebar}
      aria-label="Toggle sidebar menu"
    >
      {openMobile ? (
        <X className="h-6 w-6" />
      ) : (
        <Menu className="h-6 w-6" />
      )}
    </Button>
  );
}
