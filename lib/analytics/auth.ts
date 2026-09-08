import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
export const COOKIE = "au-analytics-session";
export const SESSION_SECONDS = 8 * 60 * 60;
export function authConfigured() {
  return (
    /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(
      process.env.ANALYTICS_PASSWORD_HASH || "",
    ) && (process.env.ANALYTICS_SESSION_SECRET?.length || 0) >= 32
  );
}
function signature(value: string) {
  return createHmac("sha256", process.env.ANALYTICS_SESSION_SECRET!)
    .update(value + ":" + process.env.ANALYTICS_PASSWORD_HASH)
    .digest("hex");
}
function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function validPassword(password: string) {
  if (!authConfigured() || password.length > 256) return false;
  const [salt, hash] = process.env.ANALYTICS_PASSWORD_HASH!.split(":");
  return equal(scryptSync(password, salt, 64).toString("hex"), hash);
}
export function createSession(now = Date.now()) {
  const expiry = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expiry}.${signature(expiry)}`;
}
export function validSession(value: string | undefined, now = Date.now()) {
  if (!authConfigured() || !value || !/^\d{10}\.[a-f0-9]{64}$/.test(value))
    return false;
  const [expiry, sig] = value.split(".");
  const time = Math.floor(now / 1000);
  return (
    Number(expiry) > time &&
    Number(expiry) <= time + SESSION_SECONDS &&
    equal(sig, signature(expiry))
  );
}
