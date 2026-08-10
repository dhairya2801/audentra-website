import { Bolt, Compass, Lightbulb, Network } from "./icons";

/**
 * The operating model, reduced to a motif. It used to be a full section of
 * five cards; the sequence is worth stating once, small, directly under the
 * product surface that demonstrates it.
 */
const STEPS = [
  { icon: Network, label: "Connect", note: "Signals from the systems you own" },
  { icon: Lightbulb, label: "Understand", note: "What changed, and why it matters" },
  { icon: Compass, label: "Decide", note: "The move most likely to land" },
  { icon: Bolt, label: "Act", note: "Approved by a person, then executed" },
];

export function SignalFlow({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div className={tone === "dark" ? "au-signal au-signal--dark" : "au-signal"}>
      <span className="au-signal__label">From institutional signal to coordinated action</span>
      <ol className="au-signal__steps">
        {STEPS.map((step) => (
          <li key={step.label}>
            <step.icon size={18} />
            <b>{step.label}</b>
            <span>{step.note}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
