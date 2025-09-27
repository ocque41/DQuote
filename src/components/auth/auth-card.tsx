"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStackApp } from "@stackframe/stack";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AFTER_AUTH_RETURN_KEY = "dquote_after_auth_return_to";

const credentialsSchema = z.object({
  email: z.string({ required_error: "Email is required." }).email("Enter a valid email."),
  password: z
    .string({ required_error: "Password is required." })
    .min(8, "Password must be at least 8 characters."),
});

type CredentialsFormValues = z.infer<typeof credentialsSchema>;

type AuthMode = "login" | "signup";

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
    return `${candidate.pathname}${candidate.search}${candidate.hash}` || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function getModeCopy(mode: AuthMode) {
  if (mode === "signup") {
    return {
      title: "Create your DQuote account",
      subtitle: "Launch interactive proposals in minutes.",
      submitLabel: "Create account",
      footerPrompt: "Already have an account?",
      footerHref: "/login",
      footerCta: "Sign in",
    } as const;
  }

  return {
    title: "Welcome back",
    subtitle: "Sign in to continue building proposals.",
    submitLabel: "Sign in",
    footerPrompt: "New to DQuote?",
    footerHref: "/signup",
    footerCta: "Create an account",
  } as const;
}

export interface AuthCardProps extends React.ComponentProps<"div"> {
  mode: AuthMode;
}

export function AuthCard({ mode, className, ...props }: AuthCardProps) {
  const copy = getModeCopy(mode);
  const stackApp = useStackApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const oauthProviders = stackApp.useProject().config.oauthProviders;
  const redirectParam = searchParams?.get("redirect") ?? searchParams?.get("after_auth_return_to");
  const storedRedirect =
    typeof window !== "undefined" ? window.sessionStorage.getItem(AFTER_AUTH_RETURN_KEY) : null;
  const redirectTarget = resolveRedirectParam(redirectParam ?? storedRedirect);

  React.useEffect(() => {
    if (typeof window === "undefined" || !redirectParam) {
      return;
    }
    const safeRedirect = resolveRedirectParam(redirectParam);
    window.sessionStorage.setItem(AFTER_AUTH_RETURN_KEY, safeRedirect);
  }, [redirectParam]);

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    let active = true;

    stackApp
      .callOAuthCallback()
      .then((handled) => {
        if (!active || !handled) return;
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(AFTER_AUTH_RETURN_KEY);
        }
        router.replace(redirectTarget);
        router.refresh();
      })
      .catch((error) => {
        if (!active) return;
        console.error("OAuth callback failed", error);
        setErrorMessage("We couldn’t finish signing you in. Try again or use another method.");
      });

    return () => {
      active = false;
    };
  }, [redirectTarget, router, stackApp]);

  const onSubmit = form.handleSubmit((values) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result =
        mode === "login"
          ? await stackApp.signInWithCredential({
              email: values.email,
              password: values.password,
              noRedirect: true,
            })
          : await stackApp.signUpWithCredential({
              email: values.email,
              password: values.password,
              noRedirect: true,
            });

      if (result.status === "error") {
        console.warn(`${mode} failed`, result.error);
        setErrorMessage(result.error?.message ?? "Unable to continue. Check your details and try again.");
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(AFTER_AUTH_RETURN_KEY);
      }
      router.replace(redirectTarget);
      router.refresh();
    });
  });

  const forgotPasswordHref = stackApp.urls.forgotPassword ?? "/handler/forgot-password";

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <form className="flex flex-col gap-6" onSubmit={onSubmit}>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">{copy.title}</h1>
                <p className="text-balance text-muted-foreground">{copy.subtitle}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${mode}-email`}>Email</Label>
                <Input
                  id={`${mode}-email`}
                  type="email"
                  autoComplete={mode === "login" ? "email" : "new-email"}
                  placeholder="you@example.com"
                  disabled={isPending}
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor={`${mode}-password`}>Password</Label>
                  {mode === "login" ? (
                    <Link
                      href={forgotPasswordHref}
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                      prefetch={false}
                    >
                      Forgot password?
                    </Link>
                  ) : null}
                </div>
                <Input
                  id={`${mode}-password`}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  disabled={isPending}
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Please wait" : copy.submitLabel}
              </Button>

              {oauthProviders.length ? (
                <React.Fragment>
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {oauthProviders.map((provider) => {
                      const label = provider.id
                        .split(/[-_]/)
                        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                        .join(" ");
                      return (
                        <Button
                          key={provider.id}
                          type="button"
                          variant="outline"
                          className="w-full capitalize"
                          disabled={isPending}
                          onClick={() => {
                            setErrorMessage(null);
                            if (typeof window !== "undefined") {
                              window.sessionStorage.setItem(AFTER_AUTH_RETURN_KEY, redirectTarget);
                            }
                            void stackApp
                              .signInWithOAuth(provider.id, { returnTo: redirectTarget })
                              .catch((error) => {
                                console.error("OAuth sign-in failed", error);
                                setErrorMessage("We couldn’t redirect to the provider. Try again.");
                              });
                          }}
                        >
                          Continue with {label}
                        </Button>
                      );
                    })}
                  </div>
                </React.Fragment>
              ) : null}

              <div className="text-center text-sm text-muted-foreground">
                {copy.footerPrompt}{" "}
                <Link href={copy.footerHref} className="underline underline-offset-4" prefetch={false}>
                  {copy.footerCta}
                </Link>
              </div>
            </form>
          </div>
          <div className="relative hidden bg-muted md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/20" />
            <div className="absolute inset-0 flex flex-col justify-end gap-6 p-8 text-left text-primary-foreground">
              <div className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                Neon Auth x DQuote
              </div>
              <p className="text-lg font-semibold text-primary-foreground/90">
                Secure sign-in backed by Neon Auth keeps your proposals safe while your team focuses on closing deals.
              </p>
              <p className="text-sm text-primary-foreground/70">
                SSO, passkeys, and multi-org controls are ready out of the box.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By continuing you agree to our {" "}
        <Link href="#" prefetch={false}>
          Terms of Service
        </Link>{" "}
        and {" "}
        <Link href="#" prefetch={false}>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
