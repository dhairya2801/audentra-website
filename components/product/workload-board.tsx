"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Route, Users } from "../icons";
import { Panel } from "./mocks";

/**
 * The leader's view: where work is queued, how fast each office clears it, and
 * what has slipped past service level. Capacity bars fill once on screen —
 * the point is the comparison between offices, not a number ticking.
 */

const OFFICES = [
  { name: "Financial Aid", open: 312, median: "3.1d", load: 94, state: "over" as const },
  { name: "Admissions", open: 87, median: "1.2d", load: 46, state: "ok" as const },
  { name: "Student Accounts", open: 45, median: "2.0d", load: 61, state: "ok" as const },
  { name: "Registrar", open: 28, median: "4.4d", load: 78, state: "watch" as const },
];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function WorkloadBoard() {
  const [filled, setFilled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (prefersReducedMotion()) {
      const settle = window.setTimeout(() => setFilled(true), 0);
      return () => window.clearTimeout(settle);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setFilled(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef}>
      <Panel label="Team workload">
        <div className="pm__head">
          <span className="pm__title">Queue by office</span>
          <span className="pm__more">Against service level</span>
        </div>

        <div className="pm-load">
          {OFFICES.map((office, index) => (
            <div className="pm-load__row" key={office.name}>
              <span className="pm-load__name">{office.name}</span>
              <span className="pm-load__track">
                <i
                  className={`pm-load__fill pm-load__fill--${office.state}`}
                  style={{
                    width: filled ? `${office.load}%` : "0%",
                    transitionDelay: `${index * 90}ms`,
                  }}
                />
              </span>
              <span className="pm-load__figures">
                <b>{office.open}</b>
                <small>{office.median}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="pm-brew__section">
          <span className="pm-brew__label">Where coordination can help</span>
          <div className="pm-rows">
            <div className="pm-row">
              <span className="pm-row__icon">
                <Route size={13} />
              </span>
              <span>
                <b>Aid → Student Accounts handoff</b>
                <small>41 students with milestones across both offices</small>
              </span>
              <span className="pm-badge pm-badge--high">Coordinate</span>
            </div>
            <div className="pm-row">
              <span className="pm-row__icon pm-row__icon--purple">
                <Clock size={13} />
              </span>
              <span>
                <b>2 cases ready for leadership support</b>
                <small>Highlighted for you this morning</small>
              </span>
              <span className="pm-badge pm-badge--medium">Review</span>
            </div>
            <div className="pm-row">
              <span className="pm-row__icon pm-row__icon--teal">
                <Users size={13} />
              </span>
              <span>
                <b>Financial Aid at 94% capacity</b>
                <small>Three additional counselors align capacity by Friday</small>
              </span>
              <span className="pm-badge pm-badge--low">Suggested</span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
