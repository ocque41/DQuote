import { Metadata } from "next";
import { notFound } from "next/navigation";
import Stripe from "stripe";
import Image from "next/image";
import type { CSSProperties } from "react";

import { EventType } from "@prisma/client";

import { ProposalRuntime } from "@/components/proposal/proposal-runtime";
import { coerceProposalTheme, buildThemeTokens } from "@/components/proposal/theme";
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

  const theme = coerceProposalTheme(proposal.theme);
  const themeTokens = buildThemeTokens(theme);
  const themeStyle: CSSProperties = {
    "--proposal-brand": themeTokens.brandColor,
    "--proposal-brand-surface": themeTokens.brandSurface,
    "--proposal-brand-foreground": themeTokens.brandForeground,
    "--proposal-accent": themeTokens.accentColor,
    "--proposal-accent-surface": themeTokens.accentSurface,
    "--proposal-accent-foreground": themeTokens.accentForeground,
  } as Record<string, string>;
  const isExpired = proposal.expiresAt ? proposal.expiresAt.getTime() < Date.now() : false;
  const formattedExpiry = proposal.expiresAt
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(proposal.expiresAt)
    : null;

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
        const depositAlreadyRecorded = Boolean(proposal.quote.depositPaidAt);
        const depositAmount = Number(proposal.quote.deposit ?? 0);
        await prisma.$transaction([
          prisma.quote.update({
            where: { id: proposal.quote.id },
            data: {
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              depositPaidAt:
                proposal.quote.depositPaidAt ?? new Date((session.created ?? Date.now() / 1000) * 1000)
            }
          }),
          ...(depositAlreadyRecorded
            ? []
            : [
                prisma.event.create({
                  data: {
                    proposalId: proposal.id,
                    type: EventType.PAY,
                    data: {
                      sessionId: session.id,
                      paymentIntentId,
                      amount: depositAmount || null
                    }
                  }
                })
              ])
        ]);
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

  if (isExpired) {
    return (
      <main className="mx-auto max-w-4xl space-y-12 px-4 py-10 md:px-6" style={themeStyle}>
        <header
          className="overflow-hidden rounded-3xl border p-6 text-center shadow-sm md:text-left"
          style={{ backgroundColor: themeTokens.brandSurface, color: themeTokens.brandForeground }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center gap-3 md:items-start">
              {themeTokens.logo ? (
                <span className="inline-flex items-center justify-center rounded-xl bg-white/70 p-2 shadow-sm">
                  <Image
                    src={themeTokens.logo}
                    alt={`${proposal.org.name} logo`}
                    width={200}
                    height={48}
                    className="h-10 w-auto max-w-[200px] object-contain"
                    sizes="(max-width: 768px) 160px, 200px"
                    priority
                  />
                </span>
              ) : null}
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs uppercase tracking-wide opacity-80">Presented by {proposal.org.name}</p>
                <h1 className="text-3xl font-semibold md:text-4xl">{proposal.title}</h1>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 md:items-end">
              <span
                className="rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide"
                style={{
                  backgroundColor: themeTokens.accentSurface,
                  color: themeTokens.accentForeground,
                  borderColor: themeTokens.accentColor,
                }}
              >
                Link expired
              </span>
              <span className="text-xs opacity-80">Share ID: {proposal.shareId}</span>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-dashed bg-muted/40 p-8 text-center">
          <h2 className="text-2xl font-semibold">This proposal link has expired</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {formattedExpiry ? `It expired on ${formattedExpiry}.` : ""} Please contact {proposal.org.name} to request a fresh
            quote or updated proposal.
          </p>
        </section>
      </main>
    );
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
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 md:px-6" style={themeStyle}>
      <header
        className="overflow-hidden rounded-3xl border p-6 shadow-sm"
        style={{ backgroundColor: themeTokens.brandSurface, color: themeTokens.brandForeground }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {themeTokens.logo ? (
              <span className="inline-flex items-center justify-center rounded-2xl bg-white/80 p-3 shadow-sm">
                <Image
                  src={themeTokens.logo}
                  alt={`${proposal.org.name} logo`}
                  width={220}
                  height={60}
                  className="h-12 w-auto max-w-[220px] object-contain"
                  sizes="(max-width: 768px) 180px, 220px"
                  priority
                />
              </span>
            ) : null}
            <div className="space-y-2 text-center md:text-left">
              <p className="text-xs uppercase tracking-wide opacity-80">Presented by {proposal.org.name}</p>
              <h1 className="text-3xl font-semibold md:text-4xl">{proposal.title}</h1>
              <p className="text-sm opacity-80">
                Prepared for {proposal.client.name}
                {proposal.client.company ? ` · ${proposal.client.company}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 md:items-end">
            <span
              className="rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide"
              style={{
                backgroundColor: themeTokens.accentSurface,
                color: themeTokens.accentForeground,
                borderColor: themeTokens.accentColor,
              }}
            >
              Interactive proposal
            </span>
            <span className="text-xs opacity-80">Share ID: {proposal.shareId}</span>
            {formattedExpiry ? (
              <span className="text-xs opacity-80">Link expires {formattedExpiry}</span>
            ) : null}
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
          tags: asset.tags ?? []
        }))}
        initialTotals={
          proposal.quote
            ? {
                subtotal: Number(proposal.quote.subtotal),
                discount: proposal.quote.discount ? Number(proposal.quote.discount) : 0,
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
                acceptedByEmail: proposal.quote.acceptedByEmail,
                pdfUrl: proposal.quote.pdfUrl
              }
            : null
        }
        theme={theme}
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
