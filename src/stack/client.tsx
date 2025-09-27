import { StackClientApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  ...(projectId ? { projectId } : {}),
  ...(publishableClientKey ? { publishableClientKey } : {}),
  urls: {
    signIn: "/login",
    signUp: "/signup",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    forgotPassword: "/handler/forgot-password",
    oauthCallback: "/login",
    magicLinkCallback: "/login",
    home: "/dashboard",
  },
});
