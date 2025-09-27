import { redirect } from "next/navigation";

import { getViewerContext } from "@/server/auth";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewer = await getViewerContext();
  const redirectTo =
    resolvedSearchParams?.redirect && resolvedSearchParams.redirect.startsWith("/")
      ? resolvedSearchParams.redirect
      : "/app";

  if (viewer) {
    redirect(redirectTo);
  }

  return <SignInForm redirectTo={redirectTo} />;
}
