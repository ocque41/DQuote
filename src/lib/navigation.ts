export type SidebarIconName =
  | "layout-dashboard"
  | "file-text"
  | "notebook-pen"
  | "bar-chart-3"
  | "help-circle";

export const mainNavigation = [
  { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Quote Terminal", href: "/quotes", icon: "file-text" },
] as const satisfies ReadonlyArray<{
  title: string;
  href: string;
  icon?: SidebarIconName;
}>;

export const resourceNavigation = [
  { name: "Playbooks", href: "/docs", icon: "notebook-pen" },
  { name: "Revenue Trends", href: "/dashboard", icon: "bar-chart-3" },
  { name: "Help Center", href: "/support", icon: "help-circle" },
] as const satisfies ReadonlyArray<{
  name: string;
  href: string;
  icon: SidebarIconName;
}>;

export const secondaryNavigation = [
  { title: "Docs", href: "/docs", icon: "file-text" },
  { title: "Support", href: "/support", icon: "help-circle" },
] as const satisfies ReadonlyArray<{
  title: string;
  href: string;
  icon: SidebarIconName;
}>;
