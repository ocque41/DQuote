import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { status, provider, context } = body ?? {};
    console.info("[auth] event", { status, provider, context });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] failed to record event", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
