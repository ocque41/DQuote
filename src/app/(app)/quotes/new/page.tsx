import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { getViewerContext } from "@/server/auth";
import { getCatalogItemsForOrg } from "@/server/catalog";
import type { CatalogItem } from "@/types/catalog";

import { NewQuoteBuilder } from "./new-quote-builder";

export default async function NewQuotePage() {
  const session = await requireUser({ returnTo: "/quotes/new" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/handler/sign-in?redirect=/quotes/new");
  }

  let catalogItems: CatalogItem[] = [];

  try {
    catalogItems = await getCatalogItemsForOrg(viewer.org.id);
  } catch (error) {
    console.error("New quote page catalog items error:", error);
  }

  return (
    <AppShell
      viewer={viewer}
      title="New Quote"
      subtitle="Design the slides, branching paths, and pricing for your next proposal."
      contentClassName="gap-6"
    >
      <NewQuoteBuilder initialCatalogItems={catalogItems} />
    </AppShell>
  );
}
