"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { sanitizedUrl } from "@/lib/analytics/schema";
import { hubspotConsent } from "@/lib/contact/client";

declare global {
  interface Window {
    _hsq?: unknown[][];
    __hsInitialUrl?: string;
    __hsReferrer?: string;
  }
}
function removeCookie(name: string) {
  const host = location.hostname;
  for (const domain of ["", host, `.${host}`, ".audentra.ai"]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
  }
}
export function revokeHubSpot() {
  const loaded = !!document.getElementById("hs-script-loader");
  if (loaded) {
    (window._hsq ||= []).push(["doNotTrack"]);
    window._hsq.push(["revokeCookieConsent"]);
  }
  for (const name of ["hubspotutk", "__hstc", "__hssc", "__hssrc"])
    removeCookie(name);
  return loaded;
}
export function HubSpotTracking({ enabled }: { enabled: boolean }) {
  const path = usePathname();
  const initialized = useRef(false);
  const trackerLoaded = useRef(false);
  const previous = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const loaded = (event: Event) => {
      if ((event.target as HTMLElement)?.id === "hs-analytics")
        trackerLoaded.current = true;
    };
    document.addEventListener("load", loaded, true);
    return () => document.removeEventListener("load", loaded, true);
  }, []);
  useEffect(() => {
    if (!enabled || !hubspotConsent()) return;
    // Vendor code reads the URL independently. Never initialize on unknown query
    // strings or fragments; never feed form values into identify/event calls.
    const clean = sanitizedUrl(location.href);
    if (!clean || clean !== location.href) {
      if (initialized.current) (window._hsq ||= []).push(["doNotTrack"]);
      return;
    }
    const cleanPath = new URL(clean).pathname + new URL(clean).search;
    removeCookie("__hs_do_not_track");
    const q = (window._hsq ||= []);
    q.push(["setPath", cleanPath]);
    if (!initialized.current) {
      initialized.current = true;
      previous.current = cleanPath;
      window.__hsInitialUrl = clean;
      try {
        window.__hsReferrer = new URL(document.referrer).origin + "/";
      } catch {
        window.__hsReferrer = "";
      }
      // The loader automatically emits the initial view. Only later route
      // changes get trackPageView, including back/forward navigation.
      setReady(true);
    } else if (previous.current !== cleanPath) {
      previous.current = cleanPath;
      // Navigation while the nested analytics script is downloading only updates
      // its initial path. Queuing another view would double-count that page.
      if (trackerLoaded.current) q.push(["trackPageView"]);
    }
  }, [path, enabled]);
  return ready && enabled ? (
    <Script
      id="hs-script-loader"
      src="https://js-na1.hs-scripts.com/52074694.js"
      strategy="afterInteractive"
    />
  ) : null;
}
