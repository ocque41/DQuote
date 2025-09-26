import { NextResponse } from "next/server";
import { z } from "zod";

import { EventType, ProposalStatus } from "@prisma/client";

import { prisma } from "@/server/prisma";

const BodySchema = z.object({
  shareId: z.string()
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const proposal = await prisma.proposal.update({
    where: { shareId: parsed.data.shareId },
    data: { status: ProposalStatus.ACCEPTED },
    select: { id: true }
  });

  await prisma.event.create({
    data: {
      proposalId: proposal.id,
      type: EventType.ACCEPT
    }
  });

  return NextResponse.json({ ok: true });
}
