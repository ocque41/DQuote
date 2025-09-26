import { NextResponse } from "next/server";
import Stripe from "stripe";

import { EventType } from "@prisma/client";

import { prisma } from "@/server/prisma";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!secret || !stripeSecret) {
    return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (typeof session.id !== "string" || !session.id) {
      return NextResponse.json({ received: true });
    }

    const quote = await prisma.quote.findFirst({
      where: { stripeCheckoutSessionId: session.id },
      include: { proposal: true }
    });

    if (!quote) {
      return NextResponse.json({ received: true });
    }

    const alreadyRecorded = Boolean(quote.depositPaidAt);
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? quote.stripePaymentIntentId ?? null;

    const updateData: { depositPaidAt?: Date; stripePaymentIntentId?: string | null } = {
      stripePaymentIntentId: paymentIntentId
    };

    if (!alreadyRecorded) {
      const completedAt = typeof session.created === "number" ? new Date(session.created * 1000) : new Date();
      updateData.depositPaidAt = completedAt;
    }

    await prisma.quote.update({
      where: { id: quote.id },
      data: updateData
    });

    if (!alreadyRecorded) {
      await prisma.event.create({
        data: {
          proposalId: quote.proposalId,
          type: EventType.PAY,
          data: {
            sessionId: session.id,
            paymentIntentId,
            amount: quote.deposit ? Number(quote.deposit) : null
          }
        }
      });
    }
  }

  return NextResponse.json({ received: true });
}
