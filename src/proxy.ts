import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Report submission is open to anyone — only the manager board is gated.
const PROTECTED_PREFIXES = ["/board", "/users", "/dashboard"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  const isLoginRoute = path === "/login";

  const session = await getSession();

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Only managers have accounts/sessions now — any signed-in visitor is a manager.
  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL("/board", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/board/:path*", "/users/:path*", "/dashboard/:path*", "/login"],
};
