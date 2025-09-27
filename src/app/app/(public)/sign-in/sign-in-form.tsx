"use client";

import { SignIn } from "@stackframe/stack";

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <SignIn fullPage={false} automaticRedirect extraInfo={<RedirectHint redirectTo={redirectTo} />} />
      </div>
    </div>
  );
}

function RedirectHint({ redirectTo }: { redirectTo: string }) {
  if (!redirectTo || redirectTo === "/app") {
    return null;
  }

  return <p className="mt-4 text-sm text-muted-foreground">You&apos;ll land on {redirectTo} after signing in.</p>;
}
