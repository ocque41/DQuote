export type SidebarIconName =
  | "layout-dashboard"
  | "file-text"
  | "notebook-pen"
  | "bar-chart-3"
  | "help-circle"
  | "shopping-cart"
  | "settings"
  | "package";

export const mainNavigation = [
  { title: "Dashboard", href: "/app", icon: "layout-dashboard" },
  { title: "Quotes", href: "/app/quotes", icon: "file-text" },
  { title: "Items", href: "/app/items", icon: "package" },
] as const satisfies ReadonlyArray<{
  title: string;
  href: string;
  icon?: SidebarIconName;
}>;

export const resourceNavigation = [
  { name: "Playbooks", href: "/docs", icon: "notebook-pen" },
  { name: "Revenue Trends", href: "/app", icon: "bar-chart-3" },
  { name: "Help Center", href: "/support", icon: "help-circle" },
] as const satisfies ReadonlyArray<{
  name: string;
  href: string;
  icon: SidebarIconName;
}>;

export const secondaryNavigation = [
  { title: "Settings", href: "/app/settings", icon: "settings" },
  { title: "Support", href: "/support", icon: "help-circle" },
] as const satisfies ReadonlyArray<{
  title: string;
  href: string;
  icon: SidebarIconName;
}>;
