"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Chart, Check, Cup, Mail, Pulse, Users } from "../icons";

/**
 * The hero product surface: Audentra finding an opportunity and preparing the
 * response, rather than another analytics dashboard.
 *
 * The panel plays the reasoning chain the platform is built around —
 * signal → interpretation → opportunity → recommended action → human approval —
 * one step at a time, so the differentiation is visible before anyone reads a
 * word of copy. All figures are illustrative demo data, labelled as such in the
 * panel chrome.
 */

/** Reveal order. Step 0 is the resting state — metrics up, still scanning. */
const STEPS = [
  { id: "signal", ms: 1300 },
  { id: "interpretation", ms: 1700 },
  { id: "opportunity", ms: 1800 },
  { id: "action", ms: 1700 },
  { id: "approval", ms: 1300 },
] as const;

/** How long the finished chain stays up before the brief runs again. */
const HOLD_MS = 4200;

const METRICS = [
  { icon: Chart, value: "3,240", label: "Enrollment forecast", note: "Fall 2027" },
  { icon: Users, value: "486", label: "High-intent students", note: "This week" },
  { icon: Pulse, value: "+6.2%", label: "Momentum", note: "vs. last week", good: true },
];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function MorningBrief() {
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    if (prefersReducedMotion()) {
      if (step !== STEPS.length) {
        const settle = window.setTimeout(() => setStep(STEPS.length), 0);
        return () => window.clearTimeout(settle);
      }
      return;
    }

    const done = step >= STEPS.length;
    const timer = window.setTimeout(
      () => setStep(done ? 0 : step + 1),
      done ? HOLD_MS : STEPS[step].ms,
    );
    return () => window.clearTimeout(timer);
  }, [step, inView]);

  const shown = (id: (typeof STEPS)[number]["id"]) =>
    step > STEPS.findIndex((entry) => entry.id === id);

  return (
    <div className="pm pm-brief" ref={rootRef}>
      <div className="pm-brief__head">
        <span className="pm-brief__mark" aria-hidden="true">
          <Cup size={16} />
        </span>
        <span className="pm-brief__title">
          <b>Audentra Intelligence</b>
          <span>Morning Brief &middot; Fall 2027</span>
        </span>
        <span className="pm-brief__tag">Illustrative data</span>
      </div>

      <div className="pm__body">
        <p className="pm-brief__greeting">Good morning, Maya.</p>

        <div className="pm-brief__metrics">
          {METRICS.map((metric) => (
            <div className="pm-brief__metric" key={metric.label}>
              <metric.icon size={14} />
              <strong className={metric.good ? "is-good" : undefined}>{metric.value}</strong>
              <span>{metric.label}</span>
              <small>{metric.note}</small>
            </div>
          ))}
        </div>

        <div className="pm-brief__insight" aria-live="polite">
          <span className="pm-brief__label">
            <i className="pm-brief__dot" aria-hidden="true" />
            {shown("signal") ? "Emerging pattern" : "Reading signals…"}
          </span>

          {shown("signal") ? (
            <p className="pm-brief__headline">
              Financial aid follow-up is this week&rsquo;s clearest yield opportunity.
            </p>
          ) : (
            <p className="pm-brief__scan" aria-hidden="true">
              <i />
              <i />
              <i />
            </p>
          )}

          {shown("interpretation") ? (
            <p className="pm-brief__evidence">
              <Mail size={13} />
              <span>
                <b>42 admitted students</b> reviewed their aid package more than once but
                haven&rsquo;t completed the next step.
              </span>
            </p>
          ) : null}

          {shown("opportunity") ? (
            <div className="pm-brief__action">
              <span className="pm-brief__action-body">
                <b>Outreach sequence prepared</b>
                <small>Prioritized by deadline pressure &middot; aid counselor as owner</small>
              </span>
              <span className="pm-brief__review">
                Review <ArrowRight size={13} />
              </span>
            </div>
          ) : null}

          {shown("action") ? (
            <p className="pm-brief__gate">
              <Check size={13} />
              Human approval required before anything sends
            </p>
          ) : null}
        </div>

        <p className="pm-brief__foot">
          <span>
            {shown("approval") ? "3 opportunities ready for review" : "Scanning this week’s cohort"}
          </span>
          <span className="pm-brief__more">Open brief</span>
        </p>
      </div>
    </div>
  );
}
