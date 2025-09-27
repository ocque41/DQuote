import { NextResponse } from "next/server";

import { auth } from "@auth";

const PUBLIC_ROUTES = new Set(["/app/sign-in"]);

export default auth((request) => {
  if (PUBLIC_ROUTES.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!request.auth) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app/sign-in";
    if (!redirectUrl.searchParams.has("redirect")) {
      redirectUrl.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"]
};
