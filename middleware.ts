import { NextRequest, NextResponse } from "next/server";

// Protects authenticated app pages while keeping marketing/auth public
// Note: Auth validation is handled at the page level via requireUser()
// Middleware is lightweight and doesn't perform auth checks to avoid edge runtime limitations
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - allow through
  const isPublic =
    pathname.startsWith("/docs") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/handler") || // Stack Auth handler routes
    pathname === "/";

  if (isPublic) {
    return NextResponse.next();
  }

  // All other routes pass through
  // Auth is enforced at page level via requireUser() and getViewerContext()
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|assets|robots.txt|sitemap.xml).*)",
  ],
};
