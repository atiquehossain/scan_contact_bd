import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowed =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/t/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico";

  if (allowed) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin", request.url));
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
