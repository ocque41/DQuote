import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getViewerContext } from "@/server/auth";

const navLinks = [
  { href: "/app", label: "Overview" },
  { href: "/app/proposals", label: "Proposals" },
  { href: "/admin/analytics", label: "Analytics" }
];

export default async function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/app/sign-in");
  }

  const displayName = viewer.orgUser.name ?? viewer.sessionUser.email ?? "Account";

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold">
            DQuote
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted-foreground transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground">{viewer.org.name}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
