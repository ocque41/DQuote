import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { ItemsPageClient } from "./items-page-client";

import { getViewerContext } from "@/server/auth";
import { prisma } from "@/server/prisma";

type SerializedCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  unit: string | null;
  unitPrice: number;
  currency: string;
  active: boolean;
  tags: string[];
  variants?: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    priceOverride: number | null;
    position: number;
  }[];
};

export const metadata: Metadata = {
  title: "Items | DQuote",
};

export default async function ItemsPage() {
  const session = await requireUser({ returnTo: "/app/items" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/handler/sign-in?redirect=/app/items");
  }

  let catalogItems: SerializedCatalogItem[] = [];
  let databaseError = false;

  try {
    const items = await prisma.catalogItem.findMany({
      where: {
        orgId: viewer.org.id,
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

    // Serialize Prisma Decimal types to numbers for client component
    catalogItems = items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      variants: item.variants?.map((v) => ({
        ...v,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      })),
    }));
  } catch (error) {
    console.error("Items page database error:", error);
    databaseError = true;
  }

  if (databaseError) {
    return (
      <AppShell
        viewer={viewer}
        title="Catalog Items"
        subtitle="Manage your product and service catalog for proposals."
        contentClassName="items-center justify-center gap-4 text-center"
      >
        <h1 className="text-2xl font-semibold">Database connection issue</h1>
        <p className="max-w-2xl text-muted-foreground">
          We&apos;re having trouble loading your catalog items. Please try refreshing the page.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      viewer={viewer}
      title="Catalog Items"
      subtitle="Manage your product and service catalog for proposals."
    >
      <ItemsPageClient items={catalogItems} />
    </AppShell>
  );
}
