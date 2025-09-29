import { StackClientApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

// Development fallback - will be overridden in production with real Vercel env vars
const isDevelopment = process.env.NODE_ENV === 'development';
const fallbackProjectId = isDevelopment ? 'dev-project-id' : undefined;
const fallbackPublishableKey = isDevelopment ? 'dev-publishable-key' : undefined;

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId: projectId || fallbackProjectId,
  publishableClientKey: publishableClientKey || fallbackPublishableKey,
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
