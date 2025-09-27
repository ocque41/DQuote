import { getStackServerApp } from "@/stack/server";

type StackServerAppInstance = ReturnType<typeof getStackServerApp>;
type RequireUserSuccess = {
  user: Exclude<Awaited<ReturnType<StackServerAppInstance["getUser"]>>, null>;
};

export type RequireUserResult = { redirect: string } | RequireUserSuccess;

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
    const user = await getStackServerApp().getUser({ or: "return-null" });

    if (!user) {
      return { redirect: buildRedirect(redirectTo, returnTo) };
    }

    return { user };
  } catch (error) {
    console.error("Failed to resolve Neon Auth session", error);
    return { redirect: buildRedirect(redirectTo, returnTo) };
  }
}
