import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { getViewerContext } from "@/server/auth";

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

  return (
    <AppShell
      viewer={viewer}
      title="New Quote"
      subtitle="Design the slides, branching paths, and pricing for your next proposal."
      contentClassName="gap-6"
    >
      <NewQuoteBuilder />
    </AppShell>
  );
}
