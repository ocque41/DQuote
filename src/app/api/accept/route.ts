import { NextResponse } from "next/server";
import { z } from "zod";

import { EventType, Prisma, ProposalStatus } from "@prisma/client";

import { prisma } from "@/server/prisma";
import { generateQuotePdf } from "@/server/pdf/quote";
import { sendReceiptEmail } from "@/server/email/receipt";

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
    include: { quote: true, client: true, org: true }
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
  let pdfPath: string | null = null;
  const origin = new URL(req.url).origin;

  try {
    const result = await generateQuotePdf({
      shareId: parsed.data.shareId,
      quoteId: proposal.quote.id,
      baseUrl: origin
    });
    pdfUrl = result.pdfUrl;
    pdfPath = result.filePath;
  } catch (error) {
    console.error("Failed to generate proposal PDF", error);
  }

  const recipients = new Set<string>();
  recipients.add(parsed.data.email.toLowerCase());
  if (proposal.client?.email) {
    recipients.add(proposal.client.email.toLowerCase());
  }

  const recipientList = Array.from(recipients);
  let receiptEmailSentAt: Date | null = null;
  let receiptEmailError: string | null = null;

  if (recipientList.length) {
    try {
      await sendReceiptEmail({
        recipients: recipientList,
        orgName: proposal.org.name,
        proposalTitle: proposal.title,
        acceptorName: parsed.data.name,
        acceptorEmail: parsed.data.email,
        clientName: proposal.client?.name,
        total: totalNumber,
        deposit: computedDeposit,
        currency: proposal.quote.currency,
        receiptUrl: pdfUrl,
        pdfPath,
        baseUrl: origin
      });
      receiptEmailSentAt = new Date();
    } catch (error) {
      console.error("Failed to send receipt email", error);
      receiptEmailError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  const quoteUpdateData: Prisma.QuoteUpdateInput = {
    receiptEmailSentAt,
    receiptEmailRecipients: { set: recipientList },
    receiptEmailError
  };
  if (pdfUrl) {
    quoteUpdateData.pdfUrl = pdfUrl;
  }

  await prisma.quote.update({
    where: { id: proposal.quote.id },
    data: quoteUpdateData
  });

  return NextResponse.json({
    deposit: computedDeposit,
    signatureId,
    pdfUrl
  });
}
