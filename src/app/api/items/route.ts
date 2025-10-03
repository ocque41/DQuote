import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateApiRequest } from "@/lib/api-auth";
import { prisma } from "@/server/prisma";
import { Prisma } from "@prisma/client";

const VariantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  priceOverride: z.number().optional(),
  position: z.number().int().min(0).max(1),
});

const CreateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  code: z.string().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().positive(),
  currency: z.string().default("EUR"),
  active: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  variants: z.array(VariantSchema).min(1).max(2),
});

export async function POST(req: Request) {
  const authResult = await authenticateApiRequest();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json();
  const parsed = CreateItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { variants, ...itemData } = parsed.data;

  try {
    const item = await prisma.catalogItem.create({
      data: {
        ...itemData,
        orgId: authResult.viewer.org.id,
        unitPrice: new Prisma.Decimal(itemData.unitPrice),
        variants: {
          create: variants.map((variant) => ({
            ...variant,
            priceOverride: variant.priceOverride
              ? new Prisma.Decimal(variant.priceOverride)
              : null,
          })),
        },
      },
      include: {
        variants: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authResult = await authenticateApiRequest();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const items = await prisma.catalogItem.findMany({
      where: {
        orgId: authResult.viewer.org.id,
      },
      include: {
        variants: {
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
