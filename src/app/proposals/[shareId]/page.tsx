import { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalRuntime } from "@/components/proposal/proposal-runtime";
import { PortfolioGrid } from "./portfolio";
import { prisma } from "@/server/prisma";

interface ProposalPageProps {
  params: Promise<{ shareId: string }>;
}

export const metadata: Metadata = {
  title: "Proposal",
  description: "Interactive proposal runtime"
};

export default async function PublicProposalPage({ params }: ProposalPageProps) {
  const { shareId } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { shareId },
    include: {
      org: true,
      client: true,
      quote: true,
      selections: true,
      slides: {
        orderBy: { position: "asc" },
        include: {
          options: {
            include: { catalogItem: true }
          }
        }
      }
    }
  });

  if (!proposal) {
    notFound();
  }

  const assets = await prisma.asset.findMany({
    where: { orgId: proposal.orgId },
    include: { catalogItem: true }
  });

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:px-6">
      <header className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{proposal.org.name}</p>
        <h1 className="text-3xl font-semibold md:text-4xl">{proposal.title}</h1>
        <p className="text-sm text-muted-foreground">
          Prepared for {proposal.client.name}
          {proposal.client.company ? ` · ${proposal.client.company}` : ""}
        </p>
      </header>

      <ProposalRuntime
        proposalId={proposal.id}
        shareId={proposal.shareId}
        currency={proposal.quote?.currency ?? "EUR"}
        orgName={proposal.org.name}
        clientName={proposal.client.name}
        clientCompany={proposal.client.company}
        slides={proposal.slides.map((slide) => ({
          id: slide.id,
          type: slide.type,
          title: slide.title,
          subtitle: slide.subtitle,
          position: slide.position,
          meta: slide.meta as Record<string, unknown> | null,
          options: slide.options.map((option) => ({
            id: option.id,
            kind: option.kind,
            description: option.description,
            priceOverride: option.priceOverride ? Number(option.priceOverride) : null,
            isDefault: option.isDefault,
            isAddOn: option.isAddOn,
            minQty: option.minQty,
            maxQty: option.maxQty,
            defaultQty: option.defaultQty,
            catalogItem: option.catalogItem
              ? {
                  id: option.catalogItem.id,
                  name: option.catalogItem.name,
                  description: option.catalogItem.description,
                  unitPrice: Number(option.catalogItem.unitPrice),
                  currency: option.catalogItem.currency,
                  tags: option.catalogItem.tags
                }
              : null
          }))
        }))}
        selections={proposal.selections.map((selection) => ({ optionId: selection.optionId, qty: selection.qty }))}
        assets={assets.map((asset) => ({
          id: asset.id,
          title: asset.title,
          type: asset.type,
          url: asset.url,
          tags: asset.catalogItem?.tags ?? []
        }))}
        initialTotals={
          proposal.quote
            ? {
                subtotal: Number(proposal.quote.subtotal),
                tax: Number(proposal.quote.tax),
                total: Number(proposal.quote.total),
                deposit: proposal.quote.deposit ? Number(proposal.quote.deposit) : null
              }
            : null
        }
        theme={proposal.theme as Record<string, unknown> | null}
      />

      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">See more from our portfolio</h2>
          <p className="text-sm text-muted-foreground">
            Additional proof points curated from recent events.
          </p>
        </div>
        <PortfolioGrid
          assets={assets.map((asset) => ({
            id: asset.id,
            title: asset.title,
            type: asset.type,
            url: asset.url,
            tags: asset.catalogItem?.tags ?? []
          }))}
        />
      </section>
    </main>
  );
}
