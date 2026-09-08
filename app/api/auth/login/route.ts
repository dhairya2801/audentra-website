import { requestOrigin } from "@/lib/analytics/request-origin";
import { NextResponse } from "next/server";
import {
  authConfigured,
  COOKIE,
  createSession,
  SESSION_SECONDS,
  validPassword,
} from "@/lib/analytics/auth";
// A secondary per-instance limit. The random 192-bit password is the primary
// defense. Add Vercel Firewall rate limiting for distributed abuse control.
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  if (process.env.AUDENTRA_APP !== "analytics")
    return new Response(null, { status: 404 });
  if (!authConfigured())
    return new Response("Dashboard access is not configured.", { status: 503 });
  const origin = requestOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 2048)
    return new Response(null, { status: 413 });
  const key = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  if (attempts.size >= 10000)
    return new Response("Try again shortly.", { status: 429 });
  const attempt = attempts.get(key) || { count: 0, until: now + 60000 };
  attempt.count++;
  attempts.set(key, attempt);
  if (attempt.count > 5)
    return new Response("Too many attempts. Try again in a minute.", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  let password = "";
  try {
    password = String((await request.formData()).get("password") || "");
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!validPassword(password))
    return NextResponse.redirect(new URL("/login?error=1", origin), 303);
  attempts.delete(key);
  const response = NextResponse.redirect(new URL("/", origin), 303);
  response.cookies.set(COOKIE, createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
