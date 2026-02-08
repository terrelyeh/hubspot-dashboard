import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Public paths that don't require authentication
const publicPaths = ["/login", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if path is public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get JWT token
  // Note: In production (HTTPS), the cookie name is __Secure-authjs.session-token
  // In development (HTTP), the cookie name is authjs.session-token
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  // Debug logging (remove in production)
  if (!token) {
    console.log("[Middleware] No token found for path:", pathname);
    console.log("[Middleware] Cookies:", req.cookies.getAll().map(c => c.name));
  }

  // Check if user is authenticated
  if (!token) {
    // Redirect to login page
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  if (pathname.startsWith("/admin")) {
    const userRole = token.role as string;
    if (userRole !== "ADMIN") {
      // Redirect to dashboard if not admin
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
