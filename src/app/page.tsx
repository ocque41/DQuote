import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";

export default async function HomePage() {
  const session = await requireUser({ redirectTo: "/login", returnTo: "/dashboard" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  redirect("/dashboard");
}
