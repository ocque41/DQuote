import {
  BarChart3Icon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  NotebookPenIcon,
} from "lucide-react";

export const mainNavigation = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Quote Terminal", href: "/quotes", icon: FileTextIcon },
] as const;

export const resourceNavigation = [
  { name: "Playbooks", href: "/docs", icon: NotebookPenIcon },
  { name: "Revenue Trends", href: "/dashboard", icon: BarChart3Icon },
  { name: "Help Center", href: "/support", icon: HelpCircleIcon },
] as const;

export const secondaryNavigation = [
  { title: "Docs", href: "/docs", icon: FileTextIcon },
  { title: "Support", href: "/support", icon: HelpCircleIcon },
] as const;
