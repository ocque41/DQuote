import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";

import { prisma } from "@/server/prisma";

const BodySchema = z.object({
  shareId: z.string()
});

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 });
  }

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

  const deposit = Number(proposal.quote.deposit ?? 0);
  if (deposit <= 0) {
    return NextResponse.json({ error: "Deposit not available" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-06-20" as Stripe.LatestApiVersion
  });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: proposal.quote.acceptedByEmail ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: proposal.quote.currency,
          product_data: {
            name: `DQuote Deposit — ${proposal.title}`
          },
          unit_amount: Math.round(deposit * 100)
        }
      }
    ],
    success_url: `${baseUrl}/proposals/${proposal.shareId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/proposals/${proposal.shareId}?checkout=cancelled`
  });

  await prisma.quote.update({
    where: { id: proposal.quote.id },
    data: {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null
    }
  });

  return NextResponse.json({ url: session.url });
}
