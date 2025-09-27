import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eyebrow, H2, Lead, Muted } from "@/components/typography";

export default function SupportPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-4">
          <Eyebrow>Support</Eyebrow>
          <H2>Need a hand? We’re here to help your team ship faster.</H2>
          <Lead>
            Reach out to the DQuote crew for onboarding, pricing logic
            questions, or to tailor the Quote Terminal for your workflows.
          </Lead>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/70 bg-card">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-foreground text-lg font-semibold">
                Email us
              </h3>
              <Muted>
                Prefer async? Drop us a note and we’ll reply within one business
                day.
              </Muted>
              <Button asChild variant="ghost" className="w-fit px-0">
                <Link href="mailto:hello@dquote.io">hello@dquote.io</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-foreground text-lg font-semibold">
                Book a working session
              </h3>
              <Muted>
                Schedule a 30-minute pairing session with our product
                specialists.
              </Muted>
              <Button asChild>
                <Link href="mailto:hello@dquote.io?subject=Working%20session">
                  Pick a time
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
