import { StackHandler } from "@stackframe/stack";

import { getStackServerApp } from "@/stack/server";

let handlerPromise: Promise<Awaited<ReturnType<typeof StackHandler>>> | null = null;

function resolveHandler() {
  if (!handlerPromise) {
    handlerPromise = StackHandler({
      app: getStackServerApp(),
      fullPage: true,
    });
  }

  return handlerPromise;
}

type StackRouteHandler = Awaited<ReturnType<typeof resolveHandler>>;
type GetArgs = Parameters<StackRouteHandler["GET"]>;
type PostArgs = Parameters<StackRouteHandler["POST"]>;

export async function GET(...args: GetArgs) {
  const handler = await resolveHandler();
  return handler.GET(...args);
}

export async function POST(...args: PostArgs) {
  const handler = await resolveHandler();
  return handler.POST(...args);
}
