import Link from "next/link";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow, H1, H2, Lead, Muted } from "@/components/typography";

const featureHighlights = [
  {
    title: "Interactive proposals",
    description:
      "Guide prospects through configurable packages, live pricing, and curated proofs without exporting another PDF.",
  },
  {
    title: "Quote Terminal",
    description:
      "Monitor spreads, pin focus tickers, and prep exports for revenue ops—all scaffolded and ready for your data soon.",
  },
  {
    title: "Collaborative workflows",
    description:
      "Comment threads, approvals, and granular permissions keep sales, ops, and finance in lockstep as deals evolve.",
  },
];

const metrics = [
  {
    label: "Faster handoffs",
    value: "5x",
    copy: "Shorter turnaround from proposal request to signed agreement.",
  },
  {
    label: "Conversion lift",
    value: "28%",
    copy: "Teams close more by pairing live pricing with portfolio proofs.",
  },
  {
    label: "Org ready",
    value: "Multi-org",
    copy: "Neon Auth keeps every workspace isolated and audit ready.",
  },
];

const pillars = [
  {
    title: "Automated pricing intelligence",
    points: [
      "Model-based pricing with tax & deposit automation",
      "Instant quote revisions without opening spreadsheets",
      "Embedded approval gates for finance and legal",
    ],
  },
  {
    title: "Proof-backed storytelling",
    points: [
      "Portfolio pulls relevant case studies as prospects explore",
      "Video walk-throughs, testimonials, and ROI calculators",
      "Asset library tailored per vertical and deal stage",
    ],
  },
];

export default function MarketingPage() {
  return (
    <div className="space-y-16 md:space-y-24">
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-6">
            <Eyebrow>Revenue teams ship faster with DQuote</Eyebrow>
            <H1>
              Close complex deals with an interactive proposal that stays
              perfectly on brand.
            </H1>
            <Lead>
              DQuote blends live pricing, collaborative reviews, and
              proof-driven storytelling into a single experience—no decks to
              version, no spreadsheets to reconcile.
            </Lead>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/login" className="inline-flex items-center gap-2">
                  Get started
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/docs">Explore the docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="py-12 md:py-16">
        <div className="container mx-auto space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[2fr,3fr] lg:items-center lg:gap-10">
            <div className="space-y-4">
              <Eyebrow>Why teams switch</Eyebrow>
              <H2>Everything you need to move from pitch to signature.</H2>
              <Lead>
                Build dynamic proposals, share real-time quote updates, and keep
                stakeholders aligned without recreating collateral for every
                opportunity.
              </Lead>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featureHighlights.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-border/70 bg-card/90 h-full"
                >
                  <CardContent className="space-y-3 p-6">
                    <SparklesIcon className="text-primary size-5" />
                    <h3 className="text-foreground text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <Muted>{feature.description}</Muted>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card py-12 md:py-16">
        <div className="container mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
          <Eyebrow>Observable impact</Eyebrow>
          <div className="grid gap-6 sm:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.label} className="border-border/70 bg-muted/30">
                <CardContent className="space-y-2 p-6 text-center">
                  <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                    {metric.label}
                  </p>
                  <p className="text-foreground text-4xl font-semibold">
                    {metric.value}
                  </p>
                  <Muted className="mx-auto max-w-xs text-balance">
                    {metric.copy}
                  </Muted>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-12 md:py-16">
        <div className="container mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <Eyebrow>Enterprise ready</Eyebrow>
            <H2>Security and governance built in from day one.</H2>
            <Lead>
              Neon Auth backs every workspace with modern MFA, SSO, and org
              isolation. Bring your own identity providers or launch in minutes
              with secure defaults.
            </Lead>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="border-border/70 bg-card">
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-foreground text-xl font-semibold">
                    {pillar.title}
                  </h3>
                  <ul className="space-y-3">
                    {pillar.points.map((point) => (
                      <li
                        key={point}
                        className="text-muted-foreground flex items-start gap-3 text-sm"
                      >
                        <span className="bg-primary/10 text-primary mt-1 rounded-full p-1">
                          <CheckIcon className="size-3.5" />
                        </span>
                        <span className="text-foreground/90 text-left text-base">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container mx-auto space-y-6 px-4 text-center sm:px-6 lg:px-8">
          <Eyebrow>Ready when you are</Eyebrow>
          <H2 className="mx-auto max-w-2xl text-balance">
            Bring your pricing models, and DQuote will handle the rest.
          </H2>
          <Lead className="mx-auto max-w-3xl text-balance">
            The Quote Terminal is scaffolded for deeper quote analytics—attach
            your data when you’re ready and unlock a full revenue command
            center.
          </Lead>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Button asChild size="lg">
              <Link href="/login" className="inline-flex items-center gap-2">
                Sign in to your workspace
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="mailto:hello@dquote.io">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
