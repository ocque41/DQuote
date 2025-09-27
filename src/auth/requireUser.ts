import { stackServerApp } from "@/stack/server";

export type RequireUserResult =
  | { redirect: string }
  | { user: Exclude<Awaited<ReturnType<typeof stackServerApp.getUser>>, null> };

export async function requireUser({ redirectTo = "/handler/sign-in" }: { redirectTo?: string } = {}): Promise<RequireUserResult> {
  try {
    const user = await stackServerApp.getUser({ or: "return-null" });

    if (!user) {
      return { redirect: redirectTo };
    }

    return { user };
  } catch (error) {
    console.error("Failed to resolve Neon Auth session", error);
    return { redirect: redirectTo };
  }
}
