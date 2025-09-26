import { Metadata } from "next";
import { notFound } from "next/navigation";
import Stripe from "stripe";

import { ProposalRuntime } from "@/components/proposal/proposal-runtime";
import { PortfolioGrid } from "./portfolio";
import { prisma } from "@/server/prisma";

interface ProposalPageProps {
  params: Promise<{ shareId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Proposal",
  description: "Interactive proposal runtime"
};

export default async function PublicProposalPage({ params, searchParams }: ProposalPageProps) {
  const { shareId } = await params;
  const query = (await searchParams) ?? {};
  const rawSession = query.session_id;
  const sessionId = Array.isArray(rawSession) ? rawSession[0] : rawSession;

  const proposalInclude = {
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
  } as const;

  let proposal = await prisma.proposal.findUnique({
    where: { shareId },
    include: proposalInclude
  });

  if (!proposal) {
    notFound();
  }

  if (sessionId && process.env.STRIPE_SECRET_KEY && proposal.quote) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"]
      });
      if (session.payment_status === "paid") {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
        await prisma.quote.update({
          where: { id: proposal.quote.id },
          data: {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            depositPaidAt:
              proposal.quote.depositPaidAt ?? new Date((session.created ?? Date.now() / 1000) * 1000)
          }
        });
        proposal =
          (await prisma.proposal.findUnique({
            where: { shareId },
            include: proposalInclude
          })) ?? proposal;
      }
    } catch {
      // ignore Stripe retrieval issues – proposal will render without payment acknowledgement
    }
  }

  const selectedOptionIds = new Set(proposal.selections.map((selection) => selection.optionId));
  const selectedTags = new Set<string>();
  for (const slide of proposal.slides) {
    for (const option of slide.options) {
      if (selectedOptionIds.has(option.id)) {
        option.catalogItem?.tags.forEach((tag) => selectedTags.add(tag));
      }
    }
  }

  const activeTags = Array.from(selectedTags);
  const primaryAssets = await prisma.asset.findMany({
    where: {
      orgId: proposal.orgId,
      ...(activeTags.length ? { tags: { hasSome: activeTags } } : {})
    },
    orderBy: { createdAt: "desc" },
    take: 4
  });

  let assets = primaryAssets;
  if (assets.length < 2) {
    const filler = await prisma.asset.findMany({
      where: {
        orgId: proposal.orgId,
        id: { notIn: assets.map((asset) => asset.id) }
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(0, Math.min(4 - assets.length, Math.max(2 - assets.length, 0)))
    });
    assets = [...assets, ...filler];
  }
  if (assets.length > 4) {
    assets = assets.slice(0, 4);
  }

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
          tags: asset.tags ?? []
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
        quoteStatus={
          proposal.quote
            ? {
                signatureId: proposal.quote.signatureId,
                depositPaidAt: proposal.quote.depositPaidAt
                  ? proposal.quote.depositPaidAt.toISOString()
                  : null,
                acceptedByName: proposal.quote.acceptedByName,
                acceptedByEmail: proposal.quote.acceptedByEmail
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
            tags: asset.tags ?? []
          }))}
        />
      </section>
    </main>
  );
}
