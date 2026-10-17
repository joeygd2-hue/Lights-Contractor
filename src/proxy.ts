import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for the admin area: bounce requests without a session
 * cookie to the login page. Real verification (against the database)
 * happens in every admin page, action and route via requireAdmin().
 */
export function proxy(req: NextRequest) {
  if (!req.cookies.get("slls_admin")?.value) {
    const url = new URL("/admin/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)", "/api/admin/:path*"],
};
