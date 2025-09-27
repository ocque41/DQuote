import type { Metadata } from "next";
import { StackProvider } from "@stackframe/stack";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/providers/query-provider";
import { stackClientApp } from "@/stack/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DQuote — Interactive Proposal Builder",
  description: "Interactive proposal decks with live pricing, portfolio proofs, and instant acceptance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  const shouldMountStack = Boolean(projectId && publishableClientKey);

  return (
    <html lang="en" className="bg-background">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        {shouldMountStack ? (
          <StackProvider app={stackClientApp}>
            <QueryProvider>{children}</QueryProvider>
          </StackProvider>
        ) : (
          <QueryProvider>{children}</QueryProvider>
        )}
      </body>
    </html>
  );
}
