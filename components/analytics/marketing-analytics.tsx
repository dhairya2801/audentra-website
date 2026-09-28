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
import { captureLeadContext, clearLeadContext } from "@/lib/contact/client";
import { HubSpotTracking, revokeHubSpot } from "./hubspot-tracking";

function placementFor(link: Element) {
  return link.closest(".au-header")
    ? "header"
    : link.closest("footer")
      ? "footer"
      : link.closest(".au-hero, .au-pagehero")
        ? "hero"
        : "body";
}

export function MarketingAnalytics({
  production,
  clarityId,
  hubspotVerified = false,
}: {
  production: boolean;
  clarityId?: string;
  hubspotVerified?: boolean;
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
    if (optedOut) {
      clearVisit();
      clearLeadContext();
      revokeHubSpot();
    }
    let cancelled = false;
    // Capture in the capture phase, before Next Link can change the URL. This
    // does not wait for the asynchronous referral lookup or any vendor script.
    const captureCta = (event: MouseEvent) => {
      if (!eligible || !event.isTrusted) return;
      const link = (event.target as Element).closest("a");
      if (!link) return;
      const url = new URL(link.href, location.origin);
      if (url.origin === location.origin && url.pathname === "/demo")
        captureLeadContext(placementFor(link));
    };
    document.addEventListener("click", captureCta, true);
    if (eligible && !optedOut)
      void resolveReferral().finally(() => {
        if (!cancelled) {
          enableTracking(true);
          setActive(true);
        }
      });
    const open = () => setPreferences(true);
    const syncPreferences = (event: StorageEvent) => {
      if (event.key !== "au-analytics-consent") return;
      if (privacyOptOut()) {
        clearVisit();
        clearLeadContext();
        revokeHubSpot();
        window.clarity?.("consentv2", {
          analytics_Storage: "denied",
          ad_Storage: "denied",
        });
      }
      // Apply withdrawal in other tabs as well, unloading active recorders.
      location.reload();
    };
    window.addEventListener("au-privacy-settings", open);
    window.addEventListener("storage", syncPreferences);
    return () => {
      cancelled = true;
      document.removeEventListener("click", captureCta, true);
      enableTracking(false);
      window.removeEventListener("au-privacy-settings", open);
      window.removeEventListener("storage", syncPreferences);
    };
  }, [production]);
  useEffect(() => {
    if (!active) return;
    function view() {
      if (document.visibilityState !== "visible") return;
      captureLeadContext();
      emit("visit_started");
      emit("page_viewed");
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
      const placement = placementFor(a);
      if (url.protocol === "mailto:") emit("email_intent", "email");
      if (url.origin !== location.origin) return;
      if (url.pathname === "/demo") {
        emit("demo_cta_clicked", placement);
      }
      const product = url.pathname.split("/").at(-1);
      if (product && products.includes(product))
        emit("product_interest", product);
    }
    document.addEventListener("click", click, true);
    for (const e of ["pointerdown", "keydown", "scroll"])
      document.addEventListener(e, interaction, { passive: true });
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", view);
      document.removeEventListener("click", click, true);
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
      clearLeadContext();
      const hubspotLoaded = revokeHubSpot();
      window.clarity?.("consentv2", {
        analytics_Storage: "denied",
        ad_Storage: "denied",
      });
      // Unload an already running recorder and any queued scripts immediately.
      if (hubspotLoaded || document.querySelector("#audentra-clarity"))
        location.reload();
    } else if (!privacyOptOut() && !active) {
      // Re-run hostname/bot eligibility and attribution resolution after opt-in.
      location.reload();
    }
  }
  return (
    <>
      <HubSpotTracking
        enabled={active && consent === "granted" && hubspotVerified}
      />
      {active && (
        <Analytics
          beforeSend={(event) => {
            if (privacyOptOut()) return null;
            const url = sanitizedUrl(event.url);
            return url ? { ...event, url } : null;
          }}
        />
      )}
      {((active && (clarityId || hubspotVerified) && consent === null) ||
        preferences) && (
        <aside className="au-consent" aria-label="Analytics preferences">
          <div>
            <strong>Help us make Audentra clearer.</strong>
            <p>
              We use basic traffic analytics. With your permission, we also use
              Microsoft Clarity to understand visits through masked session
              recordings
              {hubspotVerified
                ? " and HubSpot to connect website visits with your demo request"
                : ""}
              . Form entries are excluded from general analytics.{" "}
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
