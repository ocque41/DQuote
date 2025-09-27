import { getStackServerApp } from "@/stack/server";

type StackServerAppInstance = ReturnType<typeof getStackServerApp>;
type RequireUserSuccess = {
  user: Exclude<Awaited<ReturnType<StackServerAppInstance["getUser"]>>, null>;
};

export type RequireUserResult = { redirect: string } | RequireUserSuccess;

export async function requireUser({ redirectTo = "/handler/sign-in" }: { redirectTo?: string } = {}): Promise<RequireUserResult> {
  try {
    const user = await getStackServerApp().getUser({ or: "return-null" });

    if (!user) {
      return { redirect: redirectTo };
    }

    return { user };
  } catch (error) {
    console.error("Failed to resolve Neon Auth session", error);
    return { redirect: redirectTo };
  }
}
