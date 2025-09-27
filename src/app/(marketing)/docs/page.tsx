import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow, H2, Lead, Muted } from "@/components/typography";

const guides = [
  {
    title: "Connect Neon Auth",
    summary:
      "Provision environments, copy project keys, and enable passkeys in minutes.",
    href: "#auth",
  },
  {
    title: "Model pricing rules",
    summary:
      "Capture base packages, options, taxes, and approvals with the pricing engine.",
    href: "#pricing",
  },
  {
    title: "Deploy the Quote Terminal",
    summary:
      "Wire your market data feed into the scaffolded dashboard and alerts.",
    href: "#quotes",
  },
];

export default function DocsLandingPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-4">
          <Eyebrow>Documentation</Eyebrow>
          <H2>
            Everything you need to launch your interactive quoting workspace.
          </H2>
          <Lead>
            Browse the guides below or join the workspace to see the Quote
            Terminal scaffold waiting for your data.
          </Lead>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide) => (
            <Card key={guide.title} className="border-border/70 bg-card">
              <CardContent className="space-y-4 p-6">
                <div>
                  <h3 className="text-foreground text-lg font-semibold">
                    {guide.title}
                  </h3>
                  <Muted>{guide.summary}</Muted>
                </div>
                <Button asChild variant="ghost" className="w-fit px-0">
                  <Link href={guide.href}>Read guide →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="border-primary/40 bg-primary/5 flex flex-col gap-3 rounded-2xl border border-dashed p-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="space-y-1">
            <p className="text-foreground text-lg font-semibold">
              Looking for hands-on help?
            </p>
            <Muted>
              Our team can pair with you to connect data sources, map pricing
              logic, and tailor the Quote Terminal experience.
            </Muted>
          </div>
          <Button asChild size="lg">
            <Link href="mailto:hello@dquote.io">Book a working session</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
