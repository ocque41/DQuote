import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/prisma";

const SelectionSchema = z.object({
  optionId: z.string().uuid(),
  qty: z.number().int().min(0)
});

const PricingRequestSchema = z.object({
  proposalId: z.string().uuid(),
  selections: z.array(SelectionSchema)
});

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = PricingRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: parsed.data.proposalId },
    include: {
      quote: true,
      org: {
        include: { rules: true }
      },
      slides: {
        include: {
          options: {
            include: { catalogItem: true }
          }
        }
      }
    }
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const optionMap = new Map(
    proposal.slides.flatMap((slide) => slide.options.map((option) => [option.id, option]))
  );

  let subtotal = 0;
  const selectedTags = new Set<string>();

  for (const selection of parsed.data.selections) {
    const option = optionMap.get(selection.optionId);
    if (!option || selection.qty <= 0) {
      continue;
    }

    const basePrice = Number(option.priceOverride ?? option.catalogItem?.unitPrice ?? 0);
    subtotal += basePrice * selection.qty;

    option.catalogItem?.tags?.forEach((tag) => selectedTags.add(tag));
  }

  let discountAmount = 0;
  let taxRate: number | null = null;

  for (const rule of proposal.org.rules) {
    const config = rule.config as Record<string, unknown> | null;

    if (rule.type === "discount_pct") {
      const percentageValue = config?.["percentage"];
      const percentage = typeof percentageValue === "number" ? percentageValue : Number(percentageValue ?? 0);
      const triggersValue = config?.["triggerTags"];
      const triggerTags = Array.isArray(triggersValue)
        ? (triggersValue as unknown[]).filter((tag): tag is string => typeof tag === "string")
        : [];
      const triggered = triggerTags.length
        ? triggerTags.every((tag) => selectedTags.has(tag))
        : parsed.data.selections.length > 0;
      if (percentage > 0 && triggered) {
        discountAmount += subtotal * (percentage / 100);
      }
    }

    if (rule.type === "discount_fixed") {
      const amountValue = config?.["amount"];
      const amount = typeof amountValue === "number" ? amountValue : Number(amountValue ?? 0);
      if (amount > 0) {
        discountAmount += amount;
      }
    }

    if (rule.type === "tax_pct") {
      const percentageValue = config?.["percentage"];
      const percentage = typeof percentageValue === "number" ? percentageValue : Number(percentageValue ?? 0);
      if (percentage > 0) {
        taxRate = percentage / 100;
      }
    }
  }

  discountAmount = Math.min(discountAmount, subtotal);
  const discountedSubtotal = subtotal - discountAmount;

  if (taxRate === null && proposal.quote?.subtotal) {
    const quoteSubtotal = Number(proposal.quote.subtotal);
    const quoteTax = Number(proposal.quote.tax);
    if (quoteSubtotal > 0 && quoteTax >= 0) {
      taxRate = quoteTax / quoteSubtotal;
    }
  }

  const tax = discountedSubtotal * (taxRate ?? 0);
  const total = discountedSubtotal + tax;

  return NextResponse.json({
    subtotal: round(discountedSubtotal),
    tax: round(tax),
    total: round(total)
  });
}
