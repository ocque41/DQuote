import "server-only";

import { StackServerApp } from "@stackframe/stack";

let cachedServerApp: StackServerApp | null = null;
type TokenStore = ConstructorParameters<typeof StackServerApp>[0]["tokenStore"];

function getSecretServerKey() {
  const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!secretServerKey) {
    if (isDevelopment) {
      // Development fallback - will be overridden in production with real Vercel env vars
      console.warn('[DEV] Using fallback Stack Auth key - auth will not work in development');
      return 'dev-secret-server-key';
    }
    throw new Error("STACK_SECRET_SERVER_KEY is required for Neon Auth server operations.");
  }
  return secretServerKey;
}

export function getStackServerApp() {
  if (!cachedServerApp) {
    cachedServerApp = new StackServerApp({
      tokenStore: "nextjs-cookie",
      secretServerKey: getSecretServerKey(),
    });
  }

  return cachedServerApp;
}

export function createStackServerApp(tokenStore: TokenStore) {
  return new StackServerApp({
    tokenStore,
    secretServerKey: getSecretServerKey(),
  });
}
