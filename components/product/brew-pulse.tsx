"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Chart, Clock, Cup, Doc, Mail, Users, Wallet } from "../icons";
import { Row } from "./mocks";

/* ==========================================================================
   Data
   Illustrative interface data, shaped like the Enrollment Pulse in the
   staff portal: every KPI carries a frame per comparison window.
   ========================================================================== */

type FrameId = "day" | "week" | "month" | "year";

const FRAMES: { id: FrameId; short: string; label: string }[] = [
  { id: "day", short: "1D", label: "yesterday" },
  { id: "week", short: "1W", label: "this week" },
  { id: "month", short: "1M", label: "this month" },
  { id: "year", short: "1Y", label: "vs last year" },
];

type Format = "int" | "pct" | "days";

type Frame = {
  value: number;
  delta: string;
  dir: "up" | "down";
  good: boolean;
  points: number[];
  target: string;
  progress: number;
};

type Kpi = {
  label: string;
  format: Format;
  frames: Record<FrameId, Frame>;
};

export type BrewAudience = "staff" | "leader" | "executive";

const BOARDS: Record<
  BrewAudience,
  { greeting: string; sub: string; kpis: Kpi[]; priorities: { label: string; rows: ReactNode }[] }
> = {
  staff: {
    greeting: "Good morning, Jordan.",
    sub: "Enrollment Operations",
    kpis: [
      {
        label: "Requirements cleared",
        format: "int",
        frames: {
          day: { value: 34, delta: "+9", dir: "up", good: true, points: [18, 22, 19, 26, 24, 29, 31, 34], target: "Target 30/day", progress: 100 },
          week: { value: 212, delta: "+18%", dir: "up", good: true, points: [140, 155, 149, 168, 181, 190, 204, 212], target: "Target 200/wk", progress: 100 },
          month: { value: 861, delta: "+12%", dir: "up", good: true, points: [612, 648, 690, 712, 758, 790, 824, 861], target: "Target 900/mo", progress: 96 },
          year: { value: 7940, delta: "+21%", dir: "up", good: true, points: [5100, 5600, 6050, 6400, 6900, 7250, 7620, 7940], target: "Target 8,200", progress: 97 },
        },
      },
      {
        label: "Students contacted",
        format: "int",
        frames: {
          day: { value: 51, delta: "+6", dir: "up", good: true, points: [32, 38, 41, 39, 45, 47, 49, 51], target: "Target 45/day", progress: 100 },
          week: { value: 287, delta: "+11%", dir: "up", good: true, points: [198, 214, 226, 240, 255, 268, 279, 287], target: "Target 300/wk", progress: 96 },
          month: { value: 1104, delta: "+8%", dir: "up", good: true, points: [820, 862, 904, 948, 990, 1030, 1070, 1104], target: "Target 1,200", progress: 92 },
          year: { value: 9610, delta: "+16%", dir: "up", good: true, points: [6800, 7200, 7650, 8000, 8450, 8900, 9280, 9610], target: "Target 10,000", progress: 96 },
        },
      },
      {
        label: "Median days to clear",
        format: "days",
        frames: {
          day: { value: 1.8, delta: "−0.3", dir: "down", good: true, points: [3.1, 2.9, 2.8, 2.5, 2.3, 2.1, 2, 1.8], target: "Target under 2", progress: 100 },
          week: { value: 2.1, delta: "−0.5", dir: "down", good: true, points: [3.4, 3.2, 3, 2.8, 2.6, 2.4, 2.2, 2.1], target: "Target under 2", progress: 92 },
          month: { value: 2.6, delta: "−0.8", dir: "down", good: true, points: [4.2, 4, 3.7, 3.4, 3.1, 2.9, 2.7, 2.6], target: "Target under 2", progress: 78 },
          year: { value: 3.4, delta: "−1.6", dir: "down", good: true, points: [5.4, 5.1, 4.8, 4.4, 4.1, 3.8, 3.6, 3.4], target: "Target under 3", progress: 71 },
        },
      },
    ],
    priorities: [
      {
        label: "Today's priorities",
        rows: (
          <>
            <Row icon={<Wallet size={13} />} title="Financial clearance" meta="12 students · next steps ready" priority="high" />
            <Row icon={<Doc size={13} />} tone="purple" title="Verification documents" meta="7 students · guidance prepared" priority="medium" />
            <Row icon={<Clock size={13} />} title="Deadlines in 72 hours" meta="5 students · orientation closes Friday" priority="medium" />
            <Row icon={<Mail size={13} />} tone="teal" title="3 drafts awaiting review" meta="Prepared by EDward overnight" priority="low" />
          </>
        ),
      },
    ],
  },

  leader: {
    greeting: "Good morning, Alicia.",
    sub: "Enrollment Management",
    kpis: [
      {
        label: "Queue cleared",
        format: "int",
        frames: {
          day: { value: 128, delta: "+14", dir: "up", good: true, points: [88, 96, 102, 99, 110, 118, 122, 128], target: "Target 120/day", progress: 100 },
          week: { value: 742, delta: "+9%", dir: "up", good: true, points: [540, 578, 604, 640, 668, 700, 722, 742], target: "Target 800/wk", progress: 93 },
          month: { value: 2980, delta: "+13%", dir: "up", good: true, points: [2100, 2240, 2380, 2500, 2640, 2760, 2870, 2980], target: "Target 3,200", progress: 93 },
          year: { value: 26400, delta: "+19%", dir: "up", good: true, points: [18200, 19400, 20600, 21900, 23100, 24300, 25400, 26400], target: "Target 28,000", progress: 94 },
        },
      },
      {
        label: "Within service level",
        format: "pct",
        frames: {
          day: { value: 96, delta: "+2 pts", dir: "up", good: true, points: [88, 89, 91, 90, 92, 94, 95, 96], target: "Target 95%", progress: 100 },
          week: { value: 94, delta: "+3 pts", dir: "up", good: true, points: [84, 86, 87, 89, 90, 92, 93, 94], target: "Target 95%", progress: 99 },
          month: { value: 91, delta: "+4 pts", dir: "up", good: true, points: [78, 81, 83, 85, 86, 88, 90, 91], target: "Target 95%", progress: 96 },
          year: { value: 87, delta: "+11 pts", dir: "up", good: true, points: [68, 71, 74, 77, 80, 83, 85, 87], target: "Target 90%", progress: 97 },
        },
      },
      {
        label: "Median days to clear",
        format: "days",
        frames: {
          day: { value: 2, delta: "−0.4", dir: "down", good: true, points: [3.3, 3.1, 2.9, 2.7, 2.5, 2.3, 2.1, 2], target: "Target under 2", progress: 100 },
          week: { value: 2.3, delta: "−0.6", dir: "down", good: true, points: [3.7, 3.5, 3.2, 3, 2.8, 2.6, 2.4, 2.3], target: "Target under 2", progress: 87 },
          month: { value: 2.9, delta: "−0.9", dir: "down", good: true, points: [4.5, 4.3, 4, 3.7, 3.4, 3.2, 3, 2.9], target: "Target under 3", progress: 100 },
          year: { value: 3.8, delta: "−1.4", dir: "down", good: true, points: [5.8, 5.5, 5.2, 4.9, 4.5, 4.2, 4, 3.8], target: "Target under 3", progress: 79 },
        },
      },
    ],
    priorities: [
      {
        label: "Needs a decision",
        rows: (
          <>
            <Row icon={<Users size={13} />} title="Financial Aid workflow" meta="312 active · 3.1 days median · capacity view" priority="high" />
            <Row icon={<Clock size={13} />} tone="purple" title="2 cases ready for coordination" meta="Cross-office handoff highlighted" priority="high" />
            <Row icon={<Users size={13} />} tone="teal" title="Admissions queue" meta="87 open · 1.2 days median" priority="low" />
          </>
        ),
      },
    ],
  },

  executive: {
    greeting: "Good morning, Dr. Reyes.",
    sub: "Cabinet view",
    kpis: [
      {
        label: "Deposits received",
        format: "int",
        frames: {
          day: { value: 46, delta: "+7", dir: "up", good: true, points: [24, 29, 33, 31, 38, 41, 44, 46], target: "Plan 40/day", progress: 100 },
          week: { value: 291, delta: "+6%", dir: "up", good: true, points: [198, 214, 232, 248, 260, 272, 282, 291], target: "Plan 300/wk", progress: 97 },
          month: { value: 1842, delta: "+4%", dir: "up", good: true, points: [1280, 1370, 1460, 1550, 1630, 1710, 1780, 1842], target: "Plan 1,900", progress: 97 },
          year: { value: 4210, delta: "+8%", dir: "up", good: true, points: [2900, 3120, 3340, 3560, 3760, 3940, 4090, 4210], target: "Plan 4,400", progress: 96 },
        },
      },
      {
        label: "Enrollment-ready",
        format: "pct",
        frames: {
          day: { value: 82, delta: "+1 pt", dir: "up", good: true, points: [74, 75, 77, 76, 79, 80, 81, 82], target: "Target 85%", progress: 96 },
          week: { value: 80, delta: "+3 pts", dir: "up", good: true, points: [68, 70, 72, 74, 75, 77, 79, 80], target: "Target 85%", progress: 94 },
          month: { value: 76, delta: "+6 pts", dir: "up", good: true, points: [58, 61, 64, 67, 69, 72, 74, 76], target: "Target 85%", progress: 89 },
          year: { value: 71, delta: "+9 pts", dir: "up", good: true, points: [52, 55, 58, 61, 64, 66, 69, 71], target: "Target 80%", progress: 89 },
        },
      },
      {
        label: "Enrollment opportunity",
        format: "pct",
        frames: {
          day: { value: 6.1, delta: "−0.2", dir: "down", good: true, points: [8.4, 8, 7.7, 7.3, 7, 6.6, 6.3, 6.1], target: "Ceiling 7%", progress: 100 },
          week: { value: 6.4, delta: "−0.5", dir: "down", good: true, points: [9, 8.6, 8.2, 7.8, 7.4, 7, 6.7, 6.4], target: "Ceiling 7%", progress: 100 },
          month: { value: 7.2, delta: "−1.1", dir: "down", good: true, points: [10.2, 9.8, 9.3, 8.9, 8.4, 8, 7.6, 7.2], target: "Ceiling 7%", progress: 92 },
          year: { value: 9.4, delta: "−2.3", dir: "down", good: true, points: [13.1, 12.6, 12.1, 11.5, 11, 10.4, 9.9, 9.4], target: "Ceiling 8%", progress: 84 },
        },
      },
    ],
    priorities: [
      {
        label: "Watch list",
        rows: (
          <>
            <Row icon={<Wallet size={13} />} title="Aid packaging backlog" meta="Down two weeks running" priority="low" />
            <Row icon={<Chart size={13} />} tone="purple" title="Transfer cohort readiness" meta="Trailing first-year by 11 points" priority="high" />
            <Row icon={<Users size={13} />} tone="teal" title="Housing capacity" meta="On plan for the September intake" priority="low" />
          </>
        ),
      },
    ],
  },
};

/* ==========================================================================
   Behaviour
   ========================================================================== */

const ROTATE_MS = 4600;
const TICKER_MS = 720;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function format(value: number, kind: Format) {
  if (kind === "pct") return `${value < 10 ? value.toFixed(1) : Math.round(value)}%`;
  if (kind === "days") return `${value.toFixed(1)}d`;
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Counts the displayed value toward its new target so a timeframe change reads
 * like a ticker rather than a hard swap.
 */
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

function Spark({ points, good }: { points: number[]; good: boolean }) {
  const width = 100;
  const height = 30;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, Number.EPSILON);
  const line = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 3 - ((point - min) / range) * (height - 6);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = good ? "#00c49a" : "#b54708";

  return (
    <svg className="pm-kpi__spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={stroke} opacity="0.09" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function KpiTile({ kpi, frameId }: { kpi: Kpi; frameId: FrameId }) {
  const frame = kpi.frames[frameId];
  const value = useTicker(frame.value);

  return (
    <div className="pm-kpi">
      <span className="pm-kpi__label">{kpi.label}</span>
      <span className="pm-kpi__num">{format(value, kpi.format)}</span>
      <span
        className={frame.good ? "pm-kpi__delta pm-kpi__delta--good" : "pm-kpi__delta pm-kpi__delta--watch"}
        key={frameId}
      >
        {frame.dir === "up" ? "▲" : "▼"} {frame.delta}
      </span>
      <Spark points={frame.points} good={frame.good} key={`${frameId}-spark`} />
      <span className="pm-kpi__bar">
        <i style={{ width: `${frame.progress}%` }} />
      </span>
      <span className="pm-kpi__target">
        <small>{frame.target}</small>
        <b>{frame.progress}%</b>
      </span>
    </div>
  );
}

/**
 * Morning Brew's Enrollment Pulse. "Live" cycles the comparison window every
 * few seconds; picking a window pins it.
 */
export function BrewPulse({ audience = "staff" }: { audience?: BrewAudience }) {
  const board = BOARDS[audience];
  const [pinned, setPinned] = useState<FrameId | null>(null);
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
      setRotation((current) => (current + 1) % FRAMES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [pinned, inView]);

  const frameId: FrameId = pinned ?? FRAMES[rotation].id;
  const active = FRAMES.find((frame) => frame.id === frameId) ?? FRAMES[0];

  return (
    <div className="pm" ref={rootRef}>
      <div className="pm-brew__hello">
        <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Cup size={16} />
          <b>{board.greeting}</b>
        </span>
        <span>{board.sub} &middot; enrollment pulse</span>
      </div>

      <div className="pm__body">
        <div className="pm-pulse__controls">
          <div className="pm-frames" role="group" aria-label="Comparison period">
            <button
              type="button"
              className="pm-frame"
              aria-pressed={pinned === null}
              onClick={() => setPinned(null)}
            >
              <i className="pm-livedot" aria-hidden="true" />
              LIVE
            </button>
            {FRAMES.map((frame) => (
              <button
                key={frame.id}
                type="button"
                className="pm-frame"
                aria-pressed={pinned === frame.id}
                onClick={() => setPinned(frame.id)}
              >
                {frame.short}
              </button>
            ))}
          </div>
          <p className="pm-pulse__status" aria-live="polite">
            {pinned ? "Filtered to " : "Cycling · now "}
            <b>{active.label}</b>
          </p>
        </div>

        {pinned === null ? (
          <div className="pm-pulse__progress" aria-hidden="true">
            <i key={rotation} style={{ animationDuration: `${ROTATE_MS}ms` }} />
          </div>
        ) : null}

        <div className="pm-kpi-grid">
          {board.kpis.map((kpi) => (
            <KpiTile kpi={kpi} frameId={frameId} key={kpi.label} />
          ))}
        </div>

        {board.priorities.map((group) => (
          <div className="pm-brew__section" key={group.label}>
            <span className="pm-brew__label">{group.label}</span>
            <div className="pm-rows pm-rows--stagger">{group.rows}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
