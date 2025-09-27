"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, SignUp, useStackApp, useUser } from "@stackframe/stack";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const AFTER_AUTH_RETURN_KEY = "dquote_after_auth_return_to";

type AuthMode = "login" | "signup";

const marketingLinks = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to continue building proposals.",
    footerPrompt: "New to DQuote?",
    footerHref: "/signup",
    footerCta: "Create an account",
  },
  signup: {
    title: "Create your DQuote account",
    subtitle: "Launch interactive proposals in minutes.",
    footerPrompt: "Already have an account?",
    footerHref: "/login",
    footerCta: "Sign in",
  },
} as const satisfies Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    footerPrompt: string;
    footerHref: string;
    footerCta: string;
  }
>;

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

export interface AuthCardProps extends React.ComponentProps<"div"> {
  mode: AuthMode;
}

export function AuthCard({ mode, className, ...props }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackApp = useStackApp();
  const user = useUser();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const redirectParam =
    searchParams?.get("redirect") ?? searchParams?.get("after_auth_return_to");
  const storedRedirect =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem(AFTER_AUTH_RETURN_KEY)
      : null;
  const redirectTarget = resolveRedirectParam(redirectParam ?? storedRedirect);
  const copy = marketingLinks[mode];

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
          "We couldn’t finish signing you in. Try again or use another method.",
        );
        toast.error(
          "We couldn’t finish signing you in. Try again or use another method.",
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

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(AFTER_AUTH_RETURN_KEY);
    }

    void logAuthEvent({
      status: mode === "login" ? "signed-in" : "signed-up",
      context: { userId: user.id },
    });
    router.replace(redirectTarget);
    router.refresh();
  }, [mode, redirectTarget, router, user]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
            <div className="space-y-3 text-center">
              <h1 className="text-foreground text-2xl font-semibold">
                {copy.title}
              </h1>
              <p className="text-muted-foreground text-sm text-balance md:text-base">
                {copy.subtitle}
              </p>
            </div>
            <div className="flex justify-center">
              {mode === "login" ? (
                <SignIn
                  fullPage={false}
                  automaticRedirect={false}
                  firstTab="password"
                  extraInfo={
                    <span className="text-muted-foreground text-sm">
                      Use your company email to continue.
                    </span>
                  }
                />
              ) : (
                <SignUp
                  fullPage={false}
                  automaticRedirect={false}
                  firstTab="password"
                  noPasswordRepeat
                  extraInfo={
                    <span className="text-muted-foreground text-sm">
                      Invite teammates after you sign up.
                    </span>
                  }
                />
              )}
            </div>
            <div className="text-muted-foreground text-center text-sm">
              {copy.footerPrompt}{" "}
              <Link
                href={copy.footerHref}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {copy.footerCta}
              </Link>
            </div>
            {errorMessage ? (
              <p className="text-destructive text-center text-sm">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <div className="from-primary/20 to-primary/40 relative hidden bg-gradient-to-br via-transparent md:block">
            <div className="text-primary-foreground absolute inset-0 flex flex-col justify-end gap-6 p-8 text-left">
              <div className="bg-primary/15 text-primary rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase">
                Neon Auth x DQuote
              </div>
              <p className="text-primary-foreground/90 text-lg font-semibold">
                Secure sign-in backed by Neon Auth keeps your proposals safe
                while your team focuses on closing deals.
              </p>
              <p className="text-primary-foreground/70 text-sm">
                SSO, passkeys, and multi-org controls are ready out of the box.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground hover:[&_a]:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        By continuing you agree to our <Link href="#">Terms of Service</Link>{" "}
        and <Link href="#">Privacy Policy</Link>.
      </div>
    </div>
  );
}
