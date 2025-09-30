import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  console.log(`[MIDDLEWARE TEST] Path: ${request.nextUrl.pathname}`);

  // Simple test: redirect everything except login/signup to login
  if (request.nextUrl.pathname === "/test-protected-route") {
    console.log("[MIDDLEWARE TEST] Redirecting test route to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log(`[MIDDLEWARE TEST] Allowing: ${request.nextUrl.pathname}`);
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
