import { NextRequest, NextResponse } from "next/server";

import { createStackServerApp } from "@/stack/server";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/signup",
  "/handler/sign-in",
  "/handler/sign-up"
]);

export async function middleware(request: NextRequest) {
  // Allow all marketing routes (/, /docs, /support, etc.) and public auth routes
  if (PUBLIC_ROUTES.has(request.nextUrl.pathname) ||
      request.nextUrl.pathname.startsWith("/proposals/") ||
      request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  let user = null;

  try {
    const stackApp = createStackServerApp(request);
    user = await stackApp.getUser({ or: "return-null", tokenStore: request });
  } catch (error) {
    console.error("Neon Auth middleware check failed", error);
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (!redirectUrl.searchParams.has("redirect")) {
      redirectUrl.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Marketing routes are handled by allowing them through in the middleware logic above
     */
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
