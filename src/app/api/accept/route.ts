import { NextResponse } from "next/server";
import { z } from "zod";

import { EventType, Prisma, ProposalStatus } from "@prisma/client";

import { prisma } from "@/server/prisma";
import { generateQuotePdf } from "@/server/pdf/quote";

const BodySchema = z.object({
  shareId: z.string(),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email")
});

const DEPOSIT_PERCENTAGE = 0.2;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { shareId: parsed.data.shareId },
    include: { quote: true }
  });

  if (!proposal || !proposal.quote) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const totalNumber = Number(proposal.quote.total);
  const computedDeposit = Number(proposal.quote.deposit ?? 0) > 0
    ? Number(proposal.quote.deposit)
    : Math.round(totalNumber * DEPOSIT_PERCENTAGE * 100) / 100;

  const ipHeader = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
  const ip = ipHeader ? ipHeader.split(",").map((value) => value.trim()).filter(Boolean)[0] ?? null : null;
  const userAgent = req.headers.get("user-agent") ?? null;
  const signatureId = crypto.randomUUID();

  await prisma.$transaction([
    prisma.proposal.update({
      where: { shareId: parsed.data.shareId },
      data: { status: ProposalStatus.ACCEPTED }
    }),
    prisma.quote.update({
      where: { id: proposal.quote.id },
      data: {
        deposit: new Prisma.Decimal(computedDeposit),
        signatureId,
        acceptedAt: new Date(),
        acceptedByName: parsed.data.name,
        acceptedByEmail: parsed.data.email,
        acceptedIp: ip,
        acceptedUserAgent: userAgent
      }
    }),
    prisma.event.create({
      data: {
        proposalId: proposal.id,
        type: EventType.ACCEPT,
        data: { signatureId }
      }
    })
  ]);

  let pdfUrl: string | null = null;
  const origin = new URL(req.url).origin;

  try {
    const result = await generateQuotePdf({
      shareId: parsed.data.shareId,
      quoteId: proposal.quote.id,
      baseUrl: origin
    });
    pdfUrl = result.pdfUrl;
    await prisma.quote.update({
      where: { id: proposal.quote.id },
      data: { pdfUrl }
    });
  } catch (error) {
    console.error("Failed to generate proposal PDF", error);
  }

  return NextResponse.json({
    deposit: computedDeposit,
    signatureId,
    pdfUrl
  });
}
