"use client";
import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearVisit,
  emit,
  enableTracking,
  privacyOptOut,
  resolveReferral,
  visit,
} from "@/lib/analytics/client";
import { products, sanitizedUrl } from "@/lib/analytics/schema";

export function MarketingAnalytics({
  production,
  clarityId,
}: {
  production: boolean;
  clarityId?: string;
}) {
  const path = usePathname();
  const [active, setActive] = useState(false);
  const [consent, setConsent] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(false);
  useEffect(() => {
    const optedOut = privacyOptOut();
    const eligible =
      production &&
      (["audentra.ai", "www.audentra.ai"].includes(location.hostname) ||
        process.env.NEXT_PUBLIC_ANALYTICS_TEST === "1") &&
      !/bot|crawler|spider|preview|headless|facebookexternalhit|slackbot|linkedinbot/i.test(
        navigator.userAgent,
      );
    let choice: string | null = null;
    try {
      choice = localStorage.getItem("au-analytics-consent");
    } catch {}
    // Browser-only consent must be read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(optedOut ? "denied" : choice);
    let cancelled = false;
    if (eligible && !optedOut)
      void resolveReferral().finally(() => {
        if (!cancelled) {
          enableTracking(true);
          setActive(true);
        }
      });
    const open = () => setPreferences(true);
    window.addEventListener("au-privacy-settings", open);
    return () => {
      cancelled = true;
      enableTracking(false);
      window.removeEventListener("au-privacy-settings", open);
    };
  }, [production]);
  useEffect(() => {
    if (!active) return;
    function view() {
      if (document.visibilityState !== "visible") return;
      emit("visit_started");
      if (path === "/demo") emit("demo_viewed");
      const product = path?.split("/").at(-1);
      if (product && products.includes(product))
        emit("product_interest", product);
    }
    view();
    document.addEventListener("visibilitychange", view);
    let interacted = false,
      visibleMs = 0,
      last = Date.now();
    const interaction = (event: Event) => {
      if (event.isTrusted) interacted = true;
    };
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === "visible" && document.hasFocus())
        visibleMs += Math.min(now - last, 1500);
      last = now;
      if (interacted && visibleMs >= 15000) {
        emit("engaged_visit");
        clearInterval(timer);
      }
    }, 1000);
    function click(event: MouseEvent) {
      if (!event.isTrusted) return;
      const a = (event.target as Element).closest("a");
      if (!a) return;
      const url = new URL(a.href, location.origin);
      const placement = a.closest(".au-header")
        ? "header"
        : a.closest("footer")
          ? "footer"
          : a.closest(".au-hero, .au-pagehero")
            ? "hero"
            : "body";
      if (url.protocol === "mailto:") emit("email_intent", "email");
      if (url.origin !== location.origin) return;
      if (url.pathname === "/demo") emit("demo_cta_clicked", placement);
      const product = url.pathname.split("/").at(-1);
      if (product && products.includes(product))
        emit("product_interest", product);
    }
    document.addEventListener("click", click);
    for (const e of ["pointerdown", "keydown", "scroll"])
      document.addEventListener(e, interaction, { passive: true });
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", view);
      document.removeEventListener("click", click);
      for (const e of ["pointerdown", "keydown", "scroll"])
        document.removeEventListener(e, interaction);
    };
  }, [active, path]);
  useEffect(() => {
    if (
      !active ||
      consent !== "granted" ||
      !clarityId ||
      !/^[a-z0-9]+$/i.test(clarityId)
    )
      return;
    // Clarity records URLs itself: don't initialize on unapproved query strings/hash.
    if (
      sanitizedUrl(location.href) !== location.href ||
      document.querySelector("#audentra-clarity")
    )
      return;
    window.clarity ||= Object.assign(
      (...args: unknown[]) => {
        window.clarity?.q?.push(args);
      },
      { q: [] as unknown[][] },
    );
    window.clarity("consentv2", {
      analytics_Storage: "granted",
      ad_Storage: "denied",
    });
    for (const [key, value] of Object.entries(visit().attribution))
      window.clarity("set", key, value);
    const script = document.createElement("script");
    script.id = "audentra-clarity";
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${clarityId}`;
    document.head.appendChild(script);
  }, [active, consent, clarityId, path]);
  function choose(choice: "granted" | "denied") {
    try {
      localStorage.setItem("au-analytics-consent", choice);
    } catch {}
    setConsent(choice);
    setPreferences(false);
    if (choice === "denied") {
      enableTracking(false);
      setActive(false);
      clearVisit();
      window.clarity?.("consentv2", {
        analytics_Storage: "denied",
        ad_Storage: "denied",
      });
      // Unload an already running recorder and any queued scripts immediately.
      if (document.querySelector("#audentra-clarity")) location.reload();
    } else if (!privacyOptOut() && !active) {
      // Re-run hostname/bot eligibility and attribution resolution after opt-in.
      location.reload();
    }
  }
  return (
    <>
      {active && (
        <Analytics
          beforeSend={(event) => {
            if (privacyOptOut()) return null;
            const url = sanitizedUrl(event.url);
            return url ? { ...event, url } : null;
          }}
        />
      )}
      {((active && clarityId && consent === null) || preferences) && (
        <aside className="au-consent" aria-label="Analytics preferences">
          <div>
            <strong>Help us make Audentra clearer.</strong>
            <p>
              We use basic traffic analytics. With your permission, we also use
              Microsoft Clarity to understand visits through masked session
              recordings. Form entries are excluded.{" "}
              <a href="/legal/privacy">Privacy details</a>
            </p>
          </div>
          <div className="au-consent-actions">
            <button onClick={() => choose("denied")}>Decline analytics</button>
            <button onClick={() => choose("granted")}>Allow analytics</button>
          </div>
        </aside>
      )}
    </>
  );
}
export function PrivacySettings() {
  return (
    <button
      type="button"
      className="au-privacy-settings"
      onClick={() => window.dispatchEvent(new Event("au-privacy-settings"))}
    >
      Analytics preferences
    </button>
  );
}
