import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateApiRequest } from "@/lib/api-auth";
import { prisma } from "@/server/prisma";
import { Prisma } from "@prisma/client";

const VariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  priceOverride: z.number().optional(),
  position: z.number().int().min(0).max(1),
});

const UpdateItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  code: z.string().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().positive().optional(),
  currency: z.string().optional(),
  active: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(VariantSchema).min(1).max(2).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateApiRequest();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // Verify item belongs to user's org
    const existingItem = await prisma.catalogItem.findUnique({
      where: { id },
      select: { orgId: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (existingItem.orgId !== authResult.viewer.org.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { variants, unitPrice, ...itemData } = parsed.data;

    // Prepare update data
    const updateData: {
      name?: string;
      description?: string;
      code?: string;
      unit?: string;
      unitPrice?: Prisma.Decimal;
      currency?: string;
      active?: boolean;
      tags?: string[];
      variants?: {
        deleteMany: Record<string, never>;
        create: {
          name: string;
          description?: string;
          imageUrl?: string;
          position: number;
          priceOverride?: Prisma.Decimal | null;
        }[];
      };
    } = {
      ...itemData,
    };

    if (unitPrice !== undefined) {
      updateData.unitPrice = new Prisma.Decimal(unitPrice);
    }

    // Handle variants if provided
    if (variants) {
      // Delete existing variants and create new ones
      updateData.variants = {
        deleteMany: {},
        create: variants.map((variant) => ({
          name: variant.name,
          description: variant.description,
          imageUrl: variant.imageUrl,
          position: variant.position,
          priceOverride: variant.priceOverride
            ? new Prisma.Decimal(variant.priceOverride)
            : null,
        })),
      };
    }

    const item = await prisma.catalogItem.update({
      where: { id },
      data: updateData,
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
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateApiRequest();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;

  try {
    // Verify item belongs to user's org
    const existingItem = await prisma.catalogItem.findUnique({
      where: { id },
      select: { orgId: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (existingItem.orgId !== authResult.viewer.org.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.catalogItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
