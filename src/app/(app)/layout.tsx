import Link from "next/link";

import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/app", label: "Overview" },
  { href: "/app/proposals", label: "Proposals" },
  { href: "/admin/analytics", label: "Analytics" }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
          <Button variant="outline" size="sm" asChild>
            <Link href="https://cal.com" target="_blank" rel="noreferrer">
              Book demo
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
