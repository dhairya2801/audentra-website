import type { ReactNode } from "react";
import {
  Chart,
  Chat,
  Check,
  Clipboard,
  Clock,
  Doc,
  Layers,
  Mail,
  Send,
  Users,
  Wallet,
} from "../icons";

/* ==========================================================================
   Shared chrome
   ========================================================================== */

export function Panel({
  label,
  children,
  flat = false,
}: {
  label: string;
  children: ReactNode;
  flat?: boolean;
}) {
  return (
    <div className={flat ? "pm pm--flat" : "pm"}>
      <div className="pm__bar">
        <i className="pm__dot" />
        <i className="pm__dot" />
        <i className="pm__dot" />
        <span>{label}</span>
      </div>
      <div className="pm__body">{children}</div>
    </div>
  );
}

type Priority = "high" | "medium" | "low" | "done";

const priorityLabel: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  done: "Resolved",
};

export function Row({
  icon,
  tone = "blue",
  title,
  meta,
  count,
  priority,
}: {
  icon: ReactNode;
  tone?: "blue" | "purple" | "teal";
  title: string;
  meta?: string;
  count?: string | number;
  priority?: Priority;
}) {
  return (
    <div className="pm-row">
      <span className={`pm-row__icon${tone === "purple" ? " pm-row__icon--purple" : tone === "teal" ? " pm-row__icon--teal" : ""}`}>
        {icon}
      </span>
      <span>
        <b>{title}</b>
        {meta ? <small>{meta}</small> : null}
      </span>
      {priority ? (
        <span className={`pm-badge pm-badge--${priority}`}>{priorityLabel[priority]}</span>
      ) : (
        <span className="pm-count">{count}</span>
      )}
    </div>
  );
}

/* ==========================================================================
   EDward — static thread
   The animated version lives in live-edward.tsx; this is for placements where
   a second moving element would compete for attention.
   ========================================================================== */

export function EdwardChat() {
  return (
    <div className="pm">
      <div className="pm-edward__head">
        <span className="pm-edward__avatar">
          <Chat size={16} />
        </span>
        <span>
          <b>EDward</b>
          <span>Institutional AI assistant</span>
        </span>
      </div>

      <div className="pm-edward__thread">
        <div className="pm-msg pm-msg--user">Which deposited students have a next step today?</div>
        <div className="pm-msg pm-msg--bot">
          <b>EDward</b>
          18 students have enrollment actions ready to move forward. Five have time-sensitive
          milestones. I&rsquo;ve organized them by timing and student context.
          <ul>
            <li>
              <Doc size={13} />
              <span>7 verification document milestones &mdash; guidance ready</span>
            </li>
            <li>
              <Wallet size={13} />
              <span>6 account milestones before housing selection</span>
            </li>
            <li>
              <Clock size={13} />
              <span>5 orientation registrations closing in 3 days</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="pm-edward__input">
        <span>Ask EDward anything&hellip;</span>
        <span className="pm-edward__send">
          <Send size={13} />
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Enrollment readiness overview
   ========================================================================== */

export function ReadinessOverview() {
  return (
    <Panel label="Enrollment readiness">
      <div className="pm-kpis">
        <span>
          <span className="pm-kpi__value">2,145</span>
          <span className="pm-kpi__label">Total admitted</span>
        </span>
        <span className="pm-kpi--risk">
          <span className="pm-kpi__value">18%</span>
          <span className="pm-kpi__label">In progress &middot; 386</span>
        </span>
        <span className="pm-kpi--good">
          <span className="pm-kpi__value">82%</span>
          <span className="pm-kpi__label">Requirements complete</span>
        </span>
      </div>

      <ReadinessChart />

      <div className="pm__head">
        <span className="pm__title">Top next milestones</span>
        <span className="pm__more">View all</span>
      </div>

      <div className="pm-rows">
        <Row icon={<Wallet size={13} />} title="Financial clearance" meta="Financial Aid" count={312} />
        <Row
          icon={<Doc size={13} />}
          tone="purple"
          title="Verification documents"
          meta="Admissions"
          count={87}
        />
        <Row
          icon={<Layers size={13} />}
          tone="teal"
          title="Housing deposit"
          meta="Student Accounts"
          count={45}
        />
        <Row icon={<Check size={13} />} title="Immunization record" meta="Health Services" count={28} />
      </div>
    </Panel>
  );
}

/** Readiness trend — a hand-plotted sparkline, no chart runtime required. */
export function ReadinessChart() {
  const points = [46, 42, 44, 38, 34, 36, 30, 26, 27, 22, 18, 15];
  const width = 320;
  const height = 92;
  const max = 50;
  const step = width / (points.length - 1);
  const coords = points.map((value, index) => [index * step, height - (value / max) * height] as const);
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg
      className="pm-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Share of the admitted cohort progressing toward enrollment readiness over twelve weeks"
    >
      <defs>
        <linearGradient id="pm-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6a38ff" stopOpacity="0.28" />
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
          stroke="#e9edf6"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#pm-fill)" />
      <path d={line} fill="none" stroke="url(#pm-stroke)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="3.5" fill="#00c49a" />
    </svg>
  );
}

/* ==========================================================================
   Action Center
   ========================================================================== */

export function ActionCenter({ title = "My prioritized tasks" }: { title?: string }) {
  return (
    <Panel label="Action Center">
      <div className="pm__head">
        <span className="pm__title">{title}</span>
        <span className="pm__more">24 open</span>
      </div>
      <div className="pm-rows">
        <Row
          icon={<Wallet size={13} />}
          title="Resolve financial clearance"
          meta="Sarah Johnson &middot; due today &middot; Financial Aid"
          priority="high"
        />
        <Row
          icon={<Doc size={13} />}
          tone="purple"
          title="Complete verification documents"
          meta="Devin Patel &middot; due in 2 days &middot; Admissions"
          priority="high"
        />
        <Row
          icon={<Layers size={13} />}
          tone="teal"
          title="Confirm housing deposit"
          meta="Maria Gentle &middot; due in 4 days &middot; Student Accounts"
          priority="medium"
        />
        <Row
          icon={<Mail size={13} />}
          title="Send outreach &mdash; orientation"
          meta="12 students &middot; drafted by EDward"
          priority="medium"
        />
        <Row
          icon={<Check size={13} />}
          tone="teal"
          title="Immunization record verified"
          meta="James Wilson &middot; closed 1h ago"
          priority="done"
        />
      </div>
    </Panel>
  );
}

/* ==========================================================================
   Student journey
   ========================================================================== */

const journeySteps = [
  { label: "Admitted", state: "done" },
  { label: "Deposit", state: "done" },
  { label: "Financial aid", state: "current" },
  { label: "Documents", state: "todo" },
  { label: "Housing", state: "todo" },
  { label: "Enrolled", state: "todo" },
] as const;

export function StudentJourney() {
  return (
    <Panel label="Student journey" flat>
      <div className="pm-student">
        <span className="pm-avatar">JL</span>
        <span>
          <b style={{ fontSize: "0.875rem" }}>Jordan Lee</b>
          <small style={{ color: "var(--au-ink-faint)" }}>Admitted &middot; deposit phase</small>
        </span>
        <span className="pm-badge pm-badge--high">In progress</span>
      </div>

      <div className="pm-journey">
        <span className="pm-brew__label">Enrollment progress</span>
        <div className="pm-journey__track">
          {journeySteps.map((step) => (
            <span
              key={step.label}
              className={`pm-journey__node${
                step.state === "done"
                  ? " pm-journey__node--done"
                  : step.state === "current"
                    ? " pm-journey__node--current"
                    : ""
              }`}
            >
              <i />
              <span>{step.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="pm__head" style={{ marginTop: "0.9rem" }}>
        <span className="pm__title">Next best actions</span>
        <span className="pm__more">View profile</span>
      </div>
      <div className="pm-rows">
        <Row icon={<Doc size={13} />} tone="purple" title="Upload verification documents" meta="Next step for aid packaging" priority="high" />
        <Row icon={<Wallet size={13} />} title="Confirm housing deposit" meta="Deadline in 6 days" priority="medium" />
        <Row icon={<Check size={13} />} tone="teal" title="Complete immunization record" meta="Health Services" priority="low" />
      </div>
    </Panel>
  );
}

/* ==========================================================================
   Full app frame — used where a page needs the whole workspace on screen
   ========================================================================== */

export function AppFrame({ children }: { children: ReactNode }) {
  const items = [
    { label: "Home", icon: <Chart size={12} />, active: false },
    { label: "Action Center", icon: <Clipboard size={12} />, active: true },
    { label: "Students", icon: <Users size={12} />, active: false },
    { label: "Communications", icon: <Mail size={12} />, active: false },
    { label: "EDward", icon: <Chat size={12} />, active: false },
    { label: "Knowledge", icon: <Layers size={12} />, active: false },
  ];

  return (
    <div className="pm-app">
      <div className="pm-app__side">
        <b>AUDENTRA</b>
        {items.map((item) => (
          <span key={item.label} data-active={item.active}>
            {item.icon}
            {item.label}
          </span>
        ))}
      </div>
      <div className="pm-app__main">{children}</div>
    </div>
  );
}
