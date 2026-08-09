import { Cap, Chart, Layers, Lightbulb, Shield, Users } from "./icons";

/**
 * How Audentra sits in the stack, read top to bottom in about ten seconds.
 * The load-bearing message is the first row: these systems stay put. Audentra
 * reads from them, it does not replace them.
 */

const SYSTEMS = ["SIS", "CRM", "LMS", "Financial Aid", "Email & communications", "Web activity"];

const INPUTS = [
  { icon: Shield, title: "Institutional rules", note: "Policies, requirements, and approved knowledge" },
  { icon: Layers, title: "Student context", note: "History, milestones, and open requirements" },
  { icon: Lightbulb, title: "Reasoning", note: "What changed, what it means, what to do next" },
];

const LOOP = ["See what changed", "Know what matters", "Take the next approved step"];

const AUDIENCES = [
  { icon: Chart, label: "Executives" },
  { icon: Users, label: "Enrollment teams" },
  { icon: Cap, label: "Students" },
];

export function Architecture() {
  return (
    <div className="au-arch">
      <div className="au-arch__tier">
        <span className="au-arch__tier-label">Systems of record</span>
        <ul className="au-arch__systems">
          {SYSTEMS.map((system) => (
            <li key={system}>{system}</li>
          ))}
        </ul>
        <p className="au-arch__note">These stay exactly where they are. Audentra reads from them.</p>
      </div>

      <span className="au-arch__link" aria-hidden="true" />

      <div className="au-arch__tier au-arch__tier--band">
        <strong>Connected institutional context</strong>
      </div>

      <span className="au-arch__link" aria-hidden="true" />

      <div className="au-arch__core">
        <span className="au-arch__core-label">Audentra intelligence layer</span>
        <ul className="au-arch__inputs">
          {INPUTS.map((input) => (
            <li key={input.title}>
              <input.icon size={19} />
              <b>{input.title}</b>
              <span>{input.note}</span>
            </li>
          ))}
        </ul>
        <ol className="au-arch__loop">
          {LOOP.map((stage) => (
            <li key={stage}>{stage}</li>
          ))}
        </ol>
      </div>

      <span className="au-arch__link" aria-hidden="true" />

      <div className="au-arch__tier">
        <span className="au-arch__tier-label">Role-aware experiences</span>
        <ul className="au-arch__audiences">
          {AUDIENCES.map((audience) => (
            <li key={audience.label}>
              <audience.icon size={18} />
              {audience.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
