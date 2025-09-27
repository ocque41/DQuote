import Link from "next/link";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";

const sellingPoints = [
  {
    title: "A/B slide paths",
    description: "Guide prospects through curated decision trees that feel like a deck, not a spreadsheet."
  },
  {
    title: "Live pricing intelligence",
    description: "Selections update totals instantly with guardrails, bundle logic, and tax rules applied on the fly."
  },
  {
    title: "Portfolio proofs",
    description: "Auto-match case studies and media assets to chosen options so buyers see exactly what they get."
  }
];

export default function MarketingPage() {
  return (
    <main className="relative overflow-hidden">
      <section className="gradient-banner border-b py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 text-center">
          <div className="space-y-4">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              Proposals that close themselves
            </span>
            <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
              Turn your proposal deck into an interactive buying experience.
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
              DQuote blends CPQ logic with a slide-native UX. Buyers explore curated packages, toggle add-ons, and sign + pay
              in a single flow.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/app">Launch the builder</Link>
            </Button>
            <Button variant="ghost" asChild size="lg">
              <Link href="https://cal.com" target="_blank" rel="noreferrer">
                Book a walkthrough
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
        {sellingPoints.map((item) => (
          <article key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 text-center">
          <h2 className="text-3xl font-semibold">Connect payments and booking in minutes.</h2>
          <p className="text-muted-foreground">
            Stripe Checkout handles deposits. Prisma + Neon keep proposal data in sync. Hook in Calendly for a post-accept
            kickoff meeting.
          </p>
        </div>
      </section>
    </main>
  );
}
