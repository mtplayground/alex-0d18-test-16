import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthSecret } from "@/lib/env";

const authSecret = getAuthSecret();

function isProtectedPath(pathname: string) {
  if (pathname === "/posts/new" || pathname.startsWith("/posts/new/")) {
    return true;
  }

  if (/^\/posts\/[^/]+\/reply\/?$/.test(pathname)) {
    return true;
  }

  if (/^\/posts\/[^/]+\/replies\/new\/?$/.test(pathname)) {
    return true;
  }

  if (pathname === "/profile/edit" || pathname.startsWith("/profile/edit/")) {
    return true;
  }

  return /^\/users\/[^/]+\/edit\/?$/.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  if (token) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/posts/:path*", "/profile/edit/:path*", "/users/:path*/edit"],
};
