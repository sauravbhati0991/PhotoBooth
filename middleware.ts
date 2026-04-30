import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect only /admin routes
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin_token");
    const isLoginPage = pathname === "/admin/login";

    // If not logged in and not on login page, redirect to login
    if (!adminToken && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If logged in and on login page, redirect to admin dashboard
    if (adminToken && isLoginPage) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
