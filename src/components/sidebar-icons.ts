import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  NotebookPenIcon,
} from "lucide-react";

import type { SidebarIconName } from "@/lib/navigation";

const iconMap: Record<SidebarIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboardIcon,
  "file-text": FileTextIcon,
  "notebook-pen": NotebookPenIcon,
  "bar-chart-3": BarChart3Icon,
  "help-circle": HelpCircleIcon,
};

export function getSidebarIcon(name: SidebarIconName): LucideIcon {
  return iconMap[name];
}
