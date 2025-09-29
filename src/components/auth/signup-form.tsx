"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignUp, useStackApp, useUser } from "@stackframe/stack";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const AFTER_AUTH_RETURN_KEY = "dquote_after_auth_return_to";

function resolveRedirectParam(rawRedirect: string | null) {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  if (!rawRedirect) {
    return "/dashboard";
  }

  try {
    const candidate = new URL(rawRedirect, window.location.origin);
    if (candidate.origin !== window.location.origin) {
      return "/dashboard";
    }
    return (
      `${candidate.pathname}${candidate.search}${candidate.hash}` ||
      "/dashboard"
    );
  } catch {
    return "/dashboard";
  }
}

async function logAuthEvent(payload: {
  status: string;
  provider?: string | null;
  context?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/auth/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[auth] client log failed", error);
  }
}

export type SignupFormProps = React.ComponentProps<"div">;

export function SignupForm({ className, ...props }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackApp = useStackApp();
  const user = useUser();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const redirectParam =
    searchParams?.get("redirect") ?? searchParams?.get("after_auth_return_to");
  const storedRedirect =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(AFTER_AUTH_RETURN_KEY)
      : null;
  const redirectTarget = resolveRedirectParam(redirectParam ?? storedRedirect);

  React.useEffect(() => {
    if (typeof window === "undefined" || !redirectParam) {
      return;
    }
    const safeRedirect = resolveRedirectParam(redirectParam);
    window.sessionStorage.setItem(AFTER_AUTH_RETURN_KEY, safeRedirect);
  }, [redirectParam]);

  React.useEffect(() => {
    let active = true;

    stackApp
      .callOAuthCallback()
      .then((handled) => {
        if (!active || !handled) return;
        void logAuthEvent({ status: "oauth-callback-success" });
      })
      .catch((error) => {
        if (!active) return;
        console.error("OAuth callback failed", error);
        setErrorMessage(
          "We couldn't finish signing you up. Try again or use another method.",
        );
        toast.error(
          "We couldn't finish signing you up. Try again or use another method.",
        );
        void logAuthEvent({
          status: "oauth-callback-error",
          context: { message: String(error) },
        });
      });

    return () => {
      active = false;
    };
  }, [stackApp]);

  React.useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoading(true);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(AFTER_AUTH_RETURN_KEY);
    }

    void logAuthEvent({
      status: "signed-up",
      context: { userId: user.id },
    });

    toast.success("Welcome to DQuote! Setting up your account...");
    router.replace(redirectTarget);
    router.refresh();
  }, [redirectTarget, router, user]);

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Brand and Title */}
      <div className="space-y-3 text-center">
        <div className="text-2xl font-bold text-primary">DQuote</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Create your DQuote account
          </h1>
          <p className="text-sm text-muted-foreground">
            Launch interactive proposals in minutes
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="rounded-2xl border bg-card">
        <CardContent className="space-y-6 p-6 md:p-8">
          {isLoading ? (
            <div className="space-y-4 text-center" aria-live="polite">
              <div className="size-8 mx-auto animate-spin rounded-full border-2 border-primary border-r-transparent" />
              <p className="text-sm text-muted-foreground">Creating your account...</p>
            </div>
          ) : (
            <SignUp
              fullPage={false}
              automaticRedirect={false}
              firstTab="password"
              noPasswordRepeat
              extraInfo={
                <span className="text-sm text-muted-foreground">
                  Invite teammates after you sign up.
                </span>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Footer Links */}
      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-center text-sm text-destructive">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Terms */}
      <div className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}