import { NextRequest, NextResponse } from "next/server";
import { getStackServerApp } from "@/stack/server";

// Protects authenticated app pages while keeping marketing/auth public
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  const isPublic =
    pathname.startsWith("/docs") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname === "/";

  // Static assets/images are excluded by matcher below
  if (isPublic) {
    return NextResponse.next();
  }

  // Auth-required app pages
  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/items") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const stack = getStackServerApp();
  const user = await stack.getUser({ or: "return-null" });
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|assets|robots.txt|sitemap.xml).*)",
  ],
};
