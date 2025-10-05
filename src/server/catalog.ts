import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/prisma";
import type { CatalogItem, CatalogVariant } from "@/types/catalog";

function serializeVariant(variant: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceOverride: Prisma.Decimal | null;
  position: number;
}): CatalogVariant {
  return {
    id: variant.id,
    name: variant.name,
    description: variant.description,
    imageUrl: variant.imageUrl,
    priceOverride: variant.priceOverride ? Number(variant.priceOverride) : null,
    position: variant.position,
  };
}

export async function getCatalogItemsForOrg(orgId: string): Promise<CatalogItem[]> {
  const items = await prisma.catalogItem.findMany({
    where: { orgId },
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

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    code: item.code ?? undefined,
    unit: item.unit ?? undefined,
    unitPrice: Number(item.unitPrice),
    currency: item.currency,
    active: item.active,
    tags: item.tags ?? [],
    variants: item.variants?.map(serializeVariant) ?? [],
  }));
}
