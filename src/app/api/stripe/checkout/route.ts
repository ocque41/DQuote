import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 });
  }

  const body = await req.json();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: body.lineItems ?? [],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?canceled=true`
  });

  return NextResponse.json({ url: session.url });
}
