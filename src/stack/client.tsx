import { StackClientApp } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

if ((!projectId || !publishableClientKey) && process.env.NODE_ENV !== "production") {
  console.warn(
    "Neon Auth client configuration is missing NEXT_PUBLIC_STACK_PROJECT_ID or NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY. " +
      "StackProvider will render without authentication capabilities."
  );
}

const config: ConstructorParameters<typeof StackClientApp>[0] = {
  tokenStore: "nextjs-cookie",
};

if (projectId) {
  config.projectId = projectId;
}

if (publishableClientKey) {
  config.publishableClientKey = publishableClientKey;
}

export const stackClientApp = new StackClientApp(config);
