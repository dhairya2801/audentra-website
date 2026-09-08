import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, validSession } from "./lib/analytics/auth";
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const analytics = process.env.AUDENTRA_APP === "analytics";
  if (!analytics) {
    if (
      path === "/login" ||
      path.startsWith("/api/auth/") ||
      path.startsWith("/api/dashboard") ||
      path.startsWith("/api/outreach")
    )
      return new NextResponse(null, { status: 404 });
    return NextResponse.next();
  }
  const publicRoute =
    path === "/login" ||
    path === "/api/auth/login" ||
    path.startsWith("/_next/static/") ||
    path === "/audentra-mark.png";
  let response: NextResponse;
  if (!publicRoute && !validSession(request.cookies.get(COOKIE)?.value)) {
    response = path.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
  } else if (
    !publicRoute &&
    ![
      "/",
      "/api/dashboard",
      "/api/auth/logout",
      "/api/outreach",
      "/api/outreach/export",
    ].includes(path)
  ) {
    response = new NextResponse(null, { status: 404 });
  } else response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; form-action 'self'; base-uri 'self'",
  );
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}
export const config = { matcher: ["/((?!_next/image).*)"] };
