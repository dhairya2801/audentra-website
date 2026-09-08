import { requestOrigin } from "@/lib/analytics/request-origin";
import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/analytics/auth";
export async function POST(request: Request) {
  if (process.env.AUDENTRA_APP !== "analytics")
    return new Response(null, { status: 404 });
  const origin = requestOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  const response = NextResponse.redirect(new URL("/login", origin), 303);
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
