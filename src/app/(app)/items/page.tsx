import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { ItemsPageClient } from "./items-page-client";

import { getViewerContext } from "@/server/auth";
import { getCatalogItemsForOrg } from "@/server/catalog";
import type { CatalogItem } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Items | DQuote",
};

export default async function ItemsPage() {
  const session = await requireUser({ returnTo: "/items" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/login?redirect=/items");
  }

  let catalogItems: CatalogItem[] = [];
  let databaseError = false;

  try {
    catalogItems = await getCatalogItemsForOrg(viewer.org.id);
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
