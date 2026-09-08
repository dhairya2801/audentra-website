import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, validSession } from "./auth";
export async function isAuthorized() {
  return (
    process.env.AUDENTRA_APP === "analytics" &&
    validSession((await cookies()).get(COOKIE)?.value)
  );
}
export async function requireAnalyticsAccess() {
  if (!(await isAuthorized())) redirect("/login");
}
