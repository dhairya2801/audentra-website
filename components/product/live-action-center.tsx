"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Doc, Mail, Wallet } from "../icons";
import { Panel } from "./mocks";

/**
 * The Action Center queue working itself down. One task at a time moves from
 * open to resolved — the row settles into its resolved state, the open counter
 * ticks down, and the next task takes the top of the queue. Resets once the
 * queue is clear.
 */

type Task = {
  icon: "wallet" | "doc" | "mail";
  tone: "blue" | "purple" | "teal";
  title: string;
  meta: string;
  resolved: string;
  priority: "high" | "medium";
};

const QUEUE: Task[] = [
  {
    icon: "wallet",
    tone: "blue",
    title: "Resolve financial clearance",
    meta: "Sarah Johnson · due today · Financial Aid",
    resolved: "Cleared · aid packaging resumed",
    priority: "high",
  },
  {
    icon: "doc",
    tone: "purple",
    title: "Collect missing documents",
    meta: "Devin Patel · due in 2 days · Admissions",
    resolved: "Received · verification complete",
    priority: "high",
  },
  {
    icon: "mail",
    tone: "teal",
    title: "Send outreach — orientation",
    meta: "12 students · drafted by EDward",
    resolved: "Reviewed and sent · 12 students",
    priority: "medium",
  },
];

const OPEN_AT_START = 24;
const STEP_MS = 2400;
const RESET_MS = 3600;

const icons = {
  wallet: <Wallet size={13} />,
  doc: <Doc size={13} />,
  mail: <Mail size={13} />,
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function LiveActionCenter() {
  const [resolved, setResolved] = useState(0);
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
    const done = resolved >= QUEUE.length;
    const timer = window.setTimeout(
      () => setResolved(done ? 0 : resolved + 1),
      done ? RESET_MS : STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [resolved, inView]);

  return (
    <div ref={rootRef}>
      <Panel label="Action Center">
        <div className="pm__head">
          <span className="pm__title">My prioritized tasks</span>
          <span className="pm__more">{OPEN_AT_START - resolved} open</span>
        </div>

        <div className="pm-rows">
          {QUEUE.map((task, index) => {
            const isResolved = index < resolved;
            return (
              <div className={isResolved ? "pm-row pm-row--resolved" : "pm-row"} key={task.title}>
                <span
                  className={`pm-row__icon${
                    isResolved
                      ? " pm-row__icon--teal"
                      : task.tone === "purple"
                        ? " pm-row__icon--purple"
                        : task.tone === "teal"
                          ? " pm-row__icon--teal"
                          : ""
                  }`}
                >
                  {isResolved ? <Check size={13} /> : icons[task.icon]}
                </span>
                <span>
                  <b>{task.title}</b>
                  <small key={isResolved ? "done" : "open"} className="pm-row__meta">
                    {isResolved ? task.resolved : task.meta}
                  </small>
                </span>
                <span className={`pm-badge pm-badge--${isResolved ? "done" : task.priority}`}>
                  {isResolved ? "Resolved" : task.priority === "high" ? "High" : "Medium"}
                </span>
              </div>
            );
          })}
        </div>

        <p className="pm-foot" aria-live="polite">
          {resolved === 0
            ? "Ranked by deadline pressure and open items."
            : resolved >= QUEUE.length
              ? "Queue clear — the next cohort loads automatically."
              : `${resolved} resolved this session · owner notified`}
        </p>
      </Panel>
    </div>
  );
}
