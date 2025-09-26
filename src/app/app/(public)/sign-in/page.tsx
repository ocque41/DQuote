import { redirect } from "next/navigation";

import { getViewerContext } from "@/server/auth";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams
}: {
  searchParams?: { redirect?: string };
}) {
  const viewer = await getViewerContext();
  const redirectTo = searchParams?.redirect && searchParams.redirect.startsWith("/") ? searchParams.redirect : "/app";

  if (viewer) {
    redirect(redirectTo);
  }

  return <SignInForm redirectTo={redirectTo} />;
}
