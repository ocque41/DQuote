export type SidebarIconName =
  | "layout-dashboard"
  | "file-text"
  | "notebook-pen"
  | "bar-chart-3"
  | "help-circle"
  | "shopping-cart"
  | "settings"
  | "package"
  | "presentation";

export const mainNavigation = [
  { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Quotes", href: "/quotes", icon: "file-text" },
  { title: "Items", href: "/items", icon: "package" },
  { title: "Proposals", href: "/proposals", icon: "presentation" },
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
  { title: "Settings", href: "/settings", icon: "settings" },
  { title: "Support", href: "/support", icon: "help-circle" },
] as const satisfies ReadonlyArray<{
  title: string;
  href: string;
  icon: SidebarIconName;
}>;
