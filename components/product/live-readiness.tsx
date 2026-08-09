"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Doc, Layers, Wallet } from "../icons";
import { Panel, Row } from "./mocks";

/**
 * Enrollment readiness, filtered by cohort. Picking a cohort re-reads the
 * board: the headline figures count to their new values, the trend redraws,
 * and the blocker list restacks. Cycles on its own until someone chooses.
 */

type Cohort = {
  id: string;
  label: string;
  admitted: number;
  atRisk: number;
  ready: number;
  trend: number[];
  blockers: { icon: "wallet" | "doc" | "layers" | "check"; label: string; office: string; count: number }[];
};

const COHORTS: Cohort[] = [
  {
    id: "all",
    label: "All admitted",
    admitted: 2145,
    atRisk: 18,
    ready: 82,
    trend: [46, 42, 44, 38, 34, 36, 30, 26, 27, 22, 18, 15],
    blockers: [
      { icon: "wallet", label: "Financial clearance", office: "Financial Aid", count: 312 },
      { icon: "doc", label: "Missing documents", office: "Admissions", count: 87 },
      { icon: "layers", label: "Housing deposit", office: "Student Accounts", count: 45 },
      { icon: "check", label: "Immunization record", office: "Health Services", count: 28 },
    ],
  },
  {
    id: "first-year",
    label: "First-year",
    admitted: 1486,
    atRisk: 14,
    ready: 86,
    trend: [38, 36, 34, 31, 29, 27, 24, 22, 20, 18, 16, 12],
    blockers: [
      { icon: "wallet", label: "Financial clearance", office: "Financial Aid", count: 198 },
      { icon: "layers", label: "Housing deposit", office: "Student Accounts", count: 41 },
      { icon: "doc", label: "Missing documents", office: "Admissions", count: 39 },
      { icon: "check", label: "Immunization record", office: "Health Services", count: 24 },
    ],
  },
  {
    id: "transfer",
    label: "Transfer",
    admitted: 659,
    atRisk: 27,
    ready: 73,
    trend: [52, 50, 51, 47, 45, 44, 41, 38, 37, 34, 31, 28],
    blockers: [
      { icon: "doc", label: "Transcript evaluation", office: "Registrar", count: 114 },
      { icon: "wallet", label: "Financial clearance", office: "Financial Aid", count: 88 },
      { icon: "check", label: "Credit articulation", office: "Advising", count: 52 },
      { icon: "layers", label: "Housing deposit", office: "Student Accounts", count: 9 },
    ],
  },
];

const ROTATE_MS = 5200;
const TICKER_MS = 700;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useTicker(target: number) {
  const [display, setDisplay] = useState(target);
  const current = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    const from = current.current;
    if (from === target || prefersReducedMotion()) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / TICKER_MS);
      const eased = 1 - (1 - progress) ** 3;
      const value = from + (target - from) * eased;
      current.current = value;
      setDisplay(value);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target]);

  return display;
}

const icons = {
  wallet: <Wallet size={13} />,
  doc: <Doc size={13} />,
  layers: <Layers size={13} />,
  check: <Check size={13} />,
};

const tones = ["blue", "purple", "teal", "blue"] as const;

function Trend({ points }: { points: number[] }) {
  const width = 320;
  const height = 92;
  const max = 56;
  const step = width / (points.length - 1);
  const coords = points.map((value, index) => [index * step, height - (value / max) * height] as const);
  const line = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      className="pm-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Share of the cohort not yet enrollment-ready, trending down over twelve weeks"
    >
      <defs>
        <linearGradient id="pm-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6a38ff" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#6a38ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pm-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6a38ff" />
          <stop offset="100%" stopColor="#00c49a" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          x1="0"
          x2={width}
          y1={height * fraction}
          y2={height * fraction}
          stroke="#eaecf0"
          strokeWidth="1"
        />
      ))}
      <path className="pm-trend__area" d={`${line} L${width} ${height} L0 ${height} Z`} fill="url(#pm-fill)" />
      <path
        className="pm-trend__line"
        d={line}
        fill="none"
        stroke="url(#pm-stroke)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        className="pm-trend__dot"
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r="3.5"
        fill="#00c49a"
      />
    </svg>
  );
}

export function LiveReadiness() {
  const [pinned, setPinned] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
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
    if (pinned || !inView || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setRotation((current) => (current + 1) % COHORTS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [pinned, inView]);

  const cohort = COHORTS.find((entry) => entry.id === pinned) ?? COHORTS[rotation];
  const admitted = useTicker(cohort.admitted);
  const atRisk = useTicker(cohort.atRisk);
  const ready = useTicker(cohort.ready);
  const atRiskCount = Math.round((cohort.admitted * cohort.atRisk) / 100);

  return (
    <div ref={rootRef}>
      <Panel label="Enrollment readiness">
        <div className="pm-pulse__controls">
          <div className="pm-frames" role="group" aria-label="Cohort">
            {COHORTS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="pm-frame"
                aria-pressed={cohort.id === entry.id}
                onClick={() => setPinned(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {pinned === null ? (
          <div className="pm-pulse__progress" aria-hidden="true">
            <i key={rotation} style={{ animationDuration: `${ROTATE_MS}ms` }} />
          </div>
        ) : null}

        <div className="pm-kpis">
          <span>
            <span className="pm-kpi__value">{Math.round(admitted).toLocaleString("en-US")}</span>
            <span className="pm-kpi__label">Admitted</span>
          </span>
          <span className="pm-kpi--risk">
            <span className="pm-kpi__value">{Math.round(atRisk)}%</span>
            <span className="pm-kpi__label">At risk &middot; {atRiskCount}</span>
          </span>
          <span className="pm-kpi--good">
            <span className="pm-kpi__value">{Math.round(ready)}%</span>
            <span className="pm-kpi__label">Requirements complete</span>
          </span>
        </div>

        <Trend points={cohort.trend} key={`${cohort.id}-trend`} />

        <div className="pm__head">
          <span className="pm__title">Top blockers</span>
          <span className="pm__more">View all</span>
        </div>

        <div className="pm-rows pm-rows--stagger" key={`${cohort.id}-rows`}>
          {cohort.blockers.map((blocker, index) => (
            <Row
              key={blocker.label}
              icon={icons[blocker.icon]}
              tone={tones[index]}
              title={blocker.label}
              meta={blocker.office}
              count={blocker.count}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}
