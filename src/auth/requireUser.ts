import { stackServerApp } from "@/stack/server";

export type RequireUserResult =
  | { redirect: string }
  | { user: Exclude<Awaited<ReturnType<typeof stackServerApp.getUser>>, null> };

function buildRedirect(redirectTo: string, returnTo?: string) {
  if (!returnTo) {
    return redirectTo;
  }

  const url = new URL(redirectTo, "http://localhost");
  url.searchParams.set("redirect", returnTo);
  return `${url.pathname}${url.search}`;
}

export async function requireUser({
  redirectTo = "/login",
  returnTo,
}: { redirectTo?: string; returnTo?: string } = {}): Promise<RequireUserResult> {
  try {
    const user = await stackServerApp.getUser({ or: "return-null" });

    if (!user) {
      return { redirect: buildRedirect(redirectTo, returnTo) };
    }

    return { user };
  } catch (error) {
    console.error("Failed to resolve Neon Auth session", error);
    return { redirect: buildRedirect(redirectTo, returnTo) };
  }
}
