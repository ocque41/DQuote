import { notFound } from "next/navigation";

import { PortfolioGrid } from "./portfolio";
import { ProposalRuntime } from "@/components/proposal/proposal-runtime";
import { prisma } from "@/server/prisma";

interface ProposalPageProps {
  params: { shareId: string };
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const proposal = await prisma.proposal.findUnique({
    where: { shareId: params.shareId },
    include: {
      org: true,
      client: true,
      quote: true,
      selections: true,
      slides: {
        orderBy: { position: "asc" },
        include: {
          options: {
            include: {
              catalogItem: true
            }
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
    <div className="space-y-8">
      <header className="rounded-3xl border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{proposal.org.name}</p>
            <h1 className="text-3xl font-semibold">{proposal.title}</h1>
            <p className="text-sm text-muted-foreground">
              For {proposal.client.name}
              {proposal.client.company ? ` · ${proposal.client.company}` : ""}
            </p>
          </div>
          <div className="rounded-full border bg-muted px-4 py-2 text-sm text-muted-foreground">
            Share link: /proposals/{proposal.shareId}
          </div>
        </div>
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

      <section className="rounded-3xl border bg-muted/40 p-8">
        <h2 className="text-xl font-semibold">Full portfolio</h2>
        <p className="text-sm text-muted-foreground">Assets linked to your catalog appear here for self-serve browsing.</p>
        <div className="mt-6">
          <PortfolioGrid
            assets={assets.map((asset) => ({
              id: asset.id,
              title: asset.title,
              type: asset.type,
              url: asset.url,
              tags: asset.catalogItem?.tags ?? []
            }))}
          />
        </div>
      </section>
    </div>
  );
}
