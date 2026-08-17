"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Chat, Clock, Doc, Send, Wallet } from "../icons";

type Turn = {
  role: "user" | "bot";
  text: ReactNode;
  bullets?: { icon: ReactNode; text: string }[];
};

/** The exchange from the copy brief, played back one turn at a time. */
const SCRIPT: Turn[] = [
  { role: "user", text: "Which deposited students have a next step today?" },
  {
    role: "bot",
    text: (
      <>
        18 students have enrollment actions ready to move forward. Five have time-sensitive
        milestones. I&rsquo;ve organized them by timing and student context.
      </>
    ),
    bullets: [
      { icon: <Doc size={13} />, text: "7 verification document milestones — guidance ready" },
      { icon: <Wallet size={13} />, text: "6 account milestones before housing selection" },
      { icon: <Clock size={13} />, text: "5 orientation registrations closing in 3 days" },
    ],
  },
  { role: "user", text: "What should I do about Jordan?" },
  {
    role: "bot",
    text: (
      <>
        Jordan has two enrollment milestones in progress. I can summarize the current picture and
        prepare guidance for your review.
      </>
    ),
  },
  { role: "user", text: "Draft it." },
  {
    role: "bot",
    text: (
      <>
        Done. It&rsquo;s ready for review in the Action Center, with sources cited from the financial
        aid knowledge base.
      </>
    ),
  },
];

/** Composer text shown while the next question is being "typed". */
const COMPOSER_HINT = "Ask EDward anything…";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * EDward, playing the briefed conversation as a live exchange rather than a
 * still. Pauses while off screen, and renders the whole thread at once when the
 * visitor prefers reduced motion.
 */
export function LiveEdward({ height = "20rem" }: { height?: string }) {
  const [shown, setShown] = useState(0);
  const [inView, setInView] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Only animate while the panel is actually on screen.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    if (prefersReducedMotion()) {
      if (shown < SCRIPT.length) {
        const settle = window.setTimeout(() => setShown(SCRIPT.length), 0);
        return () => window.clearTimeout(settle);
      }
      return;
    }

    // Finished: hold the completed thread, then start over.
    if (shown >= SCRIPT.length) {
      const restart = window.setTimeout(() => setShown(0), 4200);
      return () => window.clearTimeout(restart);
    }

    // A question types quickly; an answer takes a beat longer to "think".
    const delay = shown === 0 ? 600 : SCRIPT[shown].role === "user" ? 900 : 1500;
    const next = window.setTimeout(() => setShown(shown + 1), delay);
    return () => window.clearTimeout(next);
  }, [shown, inView]);

  // Keep the newest turn in view inside the scrolling thread.
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [shown]);

  const visible = SCRIPT.slice(0, shown);
  const awaiting = shown < SCRIPT.length ? SCRIPT[shown] : null;

  return (
    <div className="pm" ref={rootRef}>
      <div className="pm-edward__head">
        <span className="pm-edward__avatar">
          <Chat size={16} />
        </span>
        <span>
          <b>EDward</b>
          <span>Institutional AI assistant</span>
        </span>
      </div>

      <div
        className="pm-edward__thread"
        ref={threadRef}
        aria-live="polite"
        style={{ height, maxHeight: height }}
      >
        {visible.map((turn, index) => (
          <div
            key={index}
            className={`pm-msg pm-msg--enter ${turn.role === "user" ? "pm-msg--user" : "pm-msg--bot"}`}
          >
            {turn.role === "bot" ? <b>EDward</b> : null}
            {turn.text}
            {turn.bullets ? (
              <ul>
                {turn.bullets.map((bullet) => (
                  <li key={bullet.text}>
                    {bullet.icon}
                    <span>{bullet.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        {awaiting?.role === "bot" ? (
          <span className="pm-typing" aria-label="EDward is typing">
            <i />
            <i />
            <i />
          </span>
        ) : null}
      </div>

      <div className="pm-edward__input">
        {awaiting?.role === "user" ? (
          <span>
            {COMPOSER_HINT}
            <span className="pm-caret" aria-hidden="true" />
          </span>
        ) : (
          <span>{COMPOSER_HINT}</span>
        )}
        <span className="pm-edward__send">
          <Send size={13} />
        </span>
      </div>
    </div>
  );
}
