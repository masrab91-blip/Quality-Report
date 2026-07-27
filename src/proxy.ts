import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const PROTECTED_PREFIXES = ["/report", "/board", "/users"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  const isLoginRoute = path === "/login";

  const session = await getSession();

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL(session.role === "MANAGER" ? "/board" : "/report/new", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/report/:path*", "/board/:path*", "/users/:path*", "/login"],
};
