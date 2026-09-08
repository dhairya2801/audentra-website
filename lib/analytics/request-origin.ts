// Next.js can use an internal hostname for Request.url behind a proxy.
// Browser Origin must match Host; never trust an arbitrary redirect parameter.
export function requestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return null;
  try {
    const url = new URL(origin);
    if (url.host !== host || !["http:", "https:"].includes(url.protocol))
      return null;
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
