import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const quickStats = [
  { label: "Active proposals", value: "4" },
  { label: "Avg. acceptance time", value: "18 min" },
  { label: "Win rate", value: "62%" }
];

const featuredProposals = [
  {
    title: "Summit Ventures Launch Night",
    shareId: "dq-demo-aurora",
    value: "€2,746",
    status: "Sent"
  },
  {
    title: "Riverside Weddings Showcase",
    shareId: "demo-riverside",
    value: "€5,120",
    status: "Draft"
  }
];

export default function AppHomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border bg-card px-6 py-10 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Interactive builder dashboard</h1>
            <p className="max-w-2xl text-muted-foreground">
              Launch proposal flows, monitor selections, and drop prospects straight into checkout with deposit rules you control.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/proposals/dq-demo-aurora">
              Open demo proposal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {quickStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border bg-background px-5 py-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {featuredProposals.map((proposal) => (
          <Card key={proposal.shareId} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{proposal.title}</CardTitle>
              <CardDescription>Value {proposal.value}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Status: {proposal.status}</span>
                <Link href={`/proposals/${proposal.shareId}`} className="text-primary hover:underline">
                  View proposal
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
