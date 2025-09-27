import "server-only";

import { StackServerApp } from "@stackframe/stack/next";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
});
