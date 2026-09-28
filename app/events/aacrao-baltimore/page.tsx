import type { Metadata } from "next";
import Link from "next/link";
import { ConferenceForm } from "@/components/conference-form";
import { PrivacySettings } from "@/components/analytics/marketing-analytics";
import { conference, conferenceOffer, offers } from "@/lib/conference/config";
import "./conference.css";

export const metadata: Metadata = {
  title: "A Morning Brew in Baltimore",
  description:
    "Meet Audentra at AACRAO Baltimore. Stop by for a Morning Brew and a conversation about what’s next in higher education.",
  alternates: { canonical: conference.url },
  openGraph: {
    title: "Your next conversation starts with a Morning Brew.",
    description:
      "A little break. A good conversation. Meet Audentra in Baltimore.",
    url: conference.url,
  },
};
export default function ConferencePage() {
  const offer = conferenceOffer();
  return (
    <div className="conference-page">
      <div className="conference-shell">
        <header className="conference-header">
          <Link
            className="conference-brand"
            href="/"
            aria-label="Audentra home"
          >
            <span className="conference-brand-mark" aria-hidden="true">
              a
            </span>
            audentra<span className="conference-brand-dot">.</span>
          </Link>
          <span className="conference-location">
            Hello, Baltimore <span aria-hidden="true">↗</span>
          </span>
        </header>
        <div className="conference-grid">
          <section
            className="conference-intro"
            aria-labelledby="conference-title"
          >
            <p className="conference-eyebrow">
              <span />
              AACRAO · BALTIMORE
            </p>
            <h1 id="conference-title">
              Your next conversation starts with a <em>Morning Brew.</em>
            </h1>
            <p className="conference-description">
              Take a moment, meet Audentra, and join us at the booth for{" "}
              {offer === "coffee"
                ? "a complimentary coffee"
                : offer === "swag"
                  ? "a complimentary swag item"
                  : "a complimentary coffee or swag item"}
              .
            </p>
            <div className="conference-art" aria-hidden="true">
              <svg
                viewBox="0 0 400 310"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="196" cy="151" r="132" fill="#f2dfc5" />
                <path
                  d="M60 223C120 270 275 270 337 223"
                  stroke="#c6ac88"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx="207"
                  cy="246"
                  rx="117"
                  ry="19"
                  fill="#d9c4a8"
                  opacity=".5"
                />
                <path
                  d="M273 123h18c44 0 45 64 5 68h-30"
                  stroke="#6a38ff"
                  strokeWidth="18"
                />
                <path
                  d="M117 104h160l-14 108c-3 22-23 37-64 37s-63-15-66-37z"
                  fill="#fffdf8"
                  stroke="#0a1f44"
                  strokeWidth="2"
                />
                <ellipse
                  cx="197"
                  cy="105"
                  rx="80"
                  ry="17"
                  fill="#fffdf8"
                  stroke="#0a1f44"
                  strokeWidth="2"
                />
                <ellipse cx="197" cy="108" rx="65" ry="10" fill="#644433" />
                <path
                  d="M137 153h133l-7 59c-3 22-23 37-64 37s-63-15-66-37z"
                  fill="#0a1f44"
                />
                <text
                  x="199"
                  y="186"
                  textAnchor="middle"
                  fill="white"
                  fontFamily="Arial,sans-serif"
                  fontSize="16"
                  fontWeight="600"
                >
                  audentra.
                </text>
                <text
                  x="199"
                  y="207"
                  textAnchor="middle"
                  fill="#d2c3ff"
                  fontFamily="Arial,sans-serif"
                  fontSize="9"
                  letterSpacing="2"
                >
                  MORNING BREW
                </text>
                <path
                  d="M175 78c-21-22 18-25 3-47m32 46c-22-24 20-27 6-49"
                  stroke="#ad8263"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="m327 52 4 12 12 4-12 4-4 12-4-12-12-4 12-4z"
                  fill="#6a38ff"
                />
                <circle cx="82" cy="135" r="5" fill="#00c49a" />
              </svg>
              <span className="conference-art-caption">
                Fresh perspectives, on us.
              </span>
            </div>
          </section>
          <section
            className="conference-card"
            aria-labelledby="conference-form-title"
          >
            <div className="conference-card-heading">
              <span className="conference-offer">{offers[offer].label}</span>
              <span className="conference-time">A quick hello</span>
            </div>
            <h2 id="conference-form-title">Let’s get acquainted.</h2>
            <p className="conference-card-copy">
              A few details, then come say hello.
            </p>
            <ConferenceForm offer={offer} />
          </section>
        </div>
        <footer className="conference-footer">
          <span>Institutional intelligence. Human connections.</span>
          <div>
            <Link href="/legal/privacy">Privacy</Link>
            <PrivacySettings />
          </div>
        </footer>
      </div>
    </div>
  );
}
