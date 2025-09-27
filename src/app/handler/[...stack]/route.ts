import { StackHandler } from "@stackframe/stack/next";

const secretKey = process.env.STACK_SECRET_SERVER_KEY;

if (!secretKey) {
  throw new Error("STACK_SECRET_SERVER_KEY is required to configure the Neon Auth handler route.");
}

export const { GET, POST } = StackHandler({
  secretKey,
});
