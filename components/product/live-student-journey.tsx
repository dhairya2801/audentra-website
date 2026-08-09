"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Doc, Wallet } from "../icons";
import { Panel, Row } from "./mocks";

/**
 * A student clearing a requirement. The outstanding transcript uploads, the
 * checklist item flips to complete, and the journey rail advances one stage —
 * the loop a student actually experiences, shown end to end.
 */

const STAGES = ["Admitted", "Deposit", "Financial aid", "Documents", "Housing", "Enrolled"];

/** Phases of the loop: idle → uploading → verified → advanced → reset. */
const PHASES = [
  { id: "idle", ms: 1600 },
  { id: "uploading", ms: 2200 },
  { id: "verified", ms: 1600 },
  { id: "advanced", ms: 3000 },
] as const;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function LiveStudentJourney() {
  const [phase, setPhase] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => setPhase((phase + 1) % PHASES.length), PHASES[phase].ms);
    return () => window.clearTimeout(timer);
  }, [phase, inView]);

  const state = PHASES[phase].id;
  const uploading = state === "uploading";
  const cleared = state === "verified" || state === "advanced";
  // The rail advances once the requirement clears: financial aid → documents.
  const current = state === "advanced" ? 3 : 2;

  return (
    <div ref={rootRef}>
      <Panel label="Student portal" flat>
        <div className="pm-student">
          <span className="pm-avatar">JL</span>
          <span>
            <b style={{ fontSize: "0.875rem" }}>Jordan Lee</b>
            <small style={{ color: "var(--au-ink-faint)" }}>Admitted &middot; deposit phase</small>
          </span>
          <span className={`pm-badge pm-badge--${cleared ? "done" : "high"}`}>
            {cleared ? "On track" : "At risk"}
          </span>
        </div>

        <div className="pm-journey">
          <span className="pm-brew__label">Enrollment progress</span>
          <div className="pm-journey__track">
            {STAGES.map((stage, index) => (
              <span
                key={stage}
                className={`pm-journey__node${
                  index < current
                    ? " pm-journey__node--done"
                    : index === current
                      ? " pm-journey__node--current"
                      : ""
                }`}
              >
                <i />
                <span>{stage}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="pm__head" style={{ marginTop: "0.9rem" }}>
          <span className="pm__title">Your next step</span>
          <span className="pm__more">{cleared ? "1 of 3 open" : "2 of 3 open"}</span>
        </div>

        {/* The requirement being cleared. */}
        <div className={`pm-upload${cleared ? " pm-upload--done" : ""}`}>
          <span className="pm-upload__icon">{cleared ? <Check size={14} /> : <Doc size={14} />}</span>
          <span className="pm-upload__body">
            <b>Official transcript</b>
            <small aria-live="polite">
              {state === "idle"
                ? "Required before financial aid can be packaged"
                : uploading
                  ? "Uploading transcript.pdf…"
                  : state === "verified"
                    ? "Received — Registrar verifying"
                    : "Verified · financial aid released"}
            </small>
            <span className="pm-upload__bar">
              <i
                style={{
                  width: state === "idle" ? "0%" : uploading ? "70%" : "100%",
                  transitionDuration: uploading ? "2s" : "0.5s",
                }}
              />
            </span>
          </span>
          {!cleared && !uploading ? <span className="pm-upload__cta">Upload</span> : null}
        </div>

        <div className="pm-rows" style={{ marginTop: "0.5rem" }}>
          <Row
            icon={<Wallet size={13} />}
            title="Confirm housing deposit"
            meta={cleared ? "Now unblocked · due in 6 days" : "Waiting on financial aid"}
            priority={cleared ? "medium" : "low"}
          />
        </div>
      </Panel>
    </div>
  );
}
