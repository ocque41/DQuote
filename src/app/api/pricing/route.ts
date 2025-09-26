import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/prisma";
import { evaluatePricing, PricingLineItem } from "@/server/pricing/rules";

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

  const items = parsed.data.selections
    .map((selection) => {
      const option = optionMap.get(selection.optionId);
      if (!option || selection.qty <= 0) {
        return null;
      }
      const basePrice = Number(option.priceOverride ?? option.catalogItem?.unitPrice ?? 0);
      const item: PricingLineItem = {
        optionId: option.id,
        qty: selection.qty,
        unitPrice: basePrice,
        tags: option.catalogItem?.tags ?? []
      };
      return item;
    })
    .filter((item): item is PricingLineItem => Boolean(item));

  const fallbackTaxRate = (() => {
    if (!proposal.quote?.subtotal) return undefined;
    const quoteSubtotal = Number(proposal.quote.subtotal);
    const quoteTax = Number(proposal.quote.tax);
    if (quoteSubtotal > 0 && quoteTax >= 0) {
      return quoteTax / quoteSubtotal;
    }
    return undefined;
  })();

  const evaluation = evaluatePricing({
    items,
    rules: proposal.org.rules.map((rule) => ({
      id: rule.id,
      type: rule.type,
      name: rule.name,
      config: (rule.config as Record<string, unknown> | null) ?? null
    })),
    fallbackTaxRate
  });

  if (evaluation.violations.length) {
    return NextResponse.json(
      {
        error: evaluation.violations[0]?.message ?? "Selection conflict",
        violations: evaluation.violations
      },
      { status: 400 }
    );
  }

  const netSubtotal = evaluation.subtotal - evaluation.discount;

  return NextResponse.json({
    subtotal: round(netSubtotal),
    tax: round(evaluation.tax),
    total: round(evaluation.total)
  });
}
