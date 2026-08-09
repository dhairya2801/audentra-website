"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The admit-to-enrolled journey as a progression rather than a row of cards.
 * A gradient travels the track from Deposit through to Enrolled, lighting each
 * office as it passes — the coordination the platform is doing, shown moving.
 * Holds on Enrolled, then runs again.
 */

const STEPS = [
  { label: "Deposit", office: "Admissions" },
  { label: "Financial Aid", office: "Aid office" },
  { label: "Documents", office: "Verification" },
  { label: "Student Accounts", office: "Bursar" },
  { label: "Housing", office: "Res life" },
  { label: "Orientation", office: "Student affairs" },
  { label: "Enrolled", office: "Registrar" },
];

const STEP_MS = 1050;
const HOLD_MS = 2600;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function JourneyRail({ tone = "light" }: { tone?: "light" | "dark" }) {
  const last = STEPS.length - 1;
  const [reached, setReached] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    if (prefersReducedMotion()) {
      if (reached !== last) {
        const settle = window.setTimeout(() => setReached(last), 0);
        return () => window.clearTimeout(settle);
      }
      return;
    }

    const atEnd = reached >= last;
    const timer = window.setTimeout(
      () => setReached(atEnd ? 0 : reached + 1),
      atEnd ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [reached, inView, last]);

  const progress = (reached / last) * 100;

  return (
    <div
      className={tone === "dark" ? "au-journey au-journey--dark" : "au-journey"}
      ref={rootRef}
      role="img"
      aria-label="The enrollment journey from deposit through financial aid, documents, student accounts, housing, and orientation to enrolled"
    >
      <div className="au-journey__track" aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </div>

      <ol className="au-journey__steps">
        {STEPS.map((step, index) => {
          const done = index <= reached;
          const isEnd = index === last;
          return (
            <li
              key={step.label}
              className={[
                "au-journey__step",
                done && "is-done",
                index === reached && "is-current",
                isEnd && done && "is-arrived",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="au-journey__dot" aria-hidden="true" />
              <strong>{step.label}</strong>
              <span>{step.office}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
