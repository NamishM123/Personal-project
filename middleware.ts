import { NextRequest, NextResponse } from "next/server";

/**
 * CORS for /api/* — needed so the browser extension can POST jobs
 * with `credentials: "include"`. Only allow extension origins (any
 * chrome-extension:// origin is fine; we don't need a fixed ID).
 */
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();
  const origin = req.headers.get("origin") ?? "";
  const isExtension = origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://");

  if (req.method === "OPTIONS") {
    if (!isExtension) return new NextResponse(null, { status: 204 });
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const res = NextResponse.next();
  if (isExtension) {
    const h = corsHeaders(origin);
    for (const [k, v] of Object.entries(h)) res.headers.set(k, v);
  }
  return res;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export const config = {
  matcher: ["/api/:path*"],
};
