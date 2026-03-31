import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ── Security Headers ───────────────────────────────────────────────────
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Enable XSS filter in older browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Restrict permissions / features
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(self), payment=(self)",
  );

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml).*)",
  ],
};
