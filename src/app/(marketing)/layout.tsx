import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { UserButton } from "@stackframe/stack";

import { buttonVariants } from "@/components/ui/button";
import { getStackServerApp } from "@/stack/server";
import { cn } from "@/lib/utils";

const marketingNav = [
  { name: "Product", href: "/#product" },
  { name: "Pricing", href: "/#pricing" },
  { name: "Docs", href: "/docs" },
];

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const stackApp = getStackServerApp();
  let user: Awaited<ReturnType<typeof stackApp.getUser>> | null = null;

  try {
    user = await stackApp.getUser({ or: "return-null" });
  } catch (error) {
    console.error(
      "Failed to load Neon Auth session for marketing layout",
      error,
    );
  }

  const isAuthenticated = Boolean(user);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-full font-mono text-sm">
              DQ
            </span>
            <span className="text-base font-semibold">DQuote</span>
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-6 text-sm font-medium md:flex">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-foreground transition"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "hidden text-sm font-medium md:inline-flex",
                  )}
                >
                  Dashboard
                </Link>
                <Suspense fallback={null}>
                  <UserButton />
                </Suspense>
              </>
            ) : (
              <Link
                href="/login"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-muted/40 border-t">
        <div className="text-muted-foreground container flex flex-col gap-6 px-4 py-10 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="text-muted-foreground flex items-center gap-2">
            <span className="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-full font-mono text-xs">
              DQ
            </span>
            <span>
              © {new Date().getFullYear()} DQuote. All rights reserved.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/docs" className="hover:text-foreground transition">
              Documentation
            </Link>
            <Link href="/support" className="hover:text-foreground transition">
              Support
            </Link>
            <Link
              href="mailto:hello@dquote.io"
              className="hover:text-foreground transition"
            >
              hello@dquote.io
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
