import { NextRequest, NextResponse } from "next/server";

import { createStackServerApp } from "@/stack/server";

const PUBLIC_ROUTES = new Set(["/login", "/signup", "/handler/sign-in", "/handler/sign-up"]);

export async function middleware(request: NextRequest) {
  if (PUBLIC_ROUTES.has(request.nextUrl.pathname)) {
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
  matcher: ["/app/:path*", "/admin/:path*", "/dashboard/:path*", "/quotes/:path*"]
};
