import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/prisma";

const BodySchema = z.object({
  proposalId: z.string().uuid(),
  selections: z.array(z.object({ optionId: z.string().uuid(), qty: z.number().int().min(0) }))
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { proposalId, selections } = parsed.data;

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, select: { id: true } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const optionIds = selections.map((selection) => selection.optionId);
  const options = await prisma.option.findMany({
    where: { id: { in: optionIds } },
    include: { catalogItem: true }
  });

  let subtotal = 0;
  for (const selection of selections) {
    const option = options.find((opt) => opt.id === selection.optionId);
    if (!option) continue;
    const unit = option.priceOverride ?? option.catalogItem?.unitPrice ?? 0;
    subtotal += Number(unit) * selection.qty;
  }

  const tax = subtotal * 0.21;
  const total = subtotal + tax;

  return NextResponse.json({ subtotal, tax, total });
}
