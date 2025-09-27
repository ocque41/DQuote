import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/server/prisma";

const BodySchema = z.object({
  orgId: z.string().uuid(),
  clientId: z.string().uuid(),
  title: z.string().min(3),
  expiresAt: z.string().datetime().optional(),
  theme: z.record(z.string(), z.any()).optional()
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const shareId = randomBytes(5).toString("hex");

  const proposal = await prisma.proposal.create({
    data: {
      orgId: parsed.data.orgId,
      clientId: parsed.data.clientId,
      title: parsed.data.title,
      shareId,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      theme: parsed.data.theme ?? {}
    },
    select: { id: true, shareId: true }
  });

  return NextResponse.json({ proposal });
}
