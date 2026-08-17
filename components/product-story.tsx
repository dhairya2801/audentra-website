import { Chart, CheckCircle, Handshake, Mail, Pulse, Sort } from "./icons";

const story = [
  {
    time: "8:03 AM",
    icon: Pulse,
    title: "Audentra connects the morning picture",
    body: "Financial Aid progress, upcoming dates, student activity, and current outreach come together across the institution’s existing systems.",
  },
  {
    time: "8:04 AM",
    icon: Sort,
    title: "47 students are organized around their next milestone",
    body: "Sixteen students have a time-sensitive next step, giving the team a clear place to begin the day.",
  },
  {
    time: "8:06 AM",
    icon: Handshake,
    title: "The right teams receive coordinated work",
    body: "Each case carries the student context, next milestone, owner, and date across Admissions and Financial Aid.",
  },
  {
    time: "8:12 AM",
    icon: Mail,
    title: "EDward prepares individualized guidance",
    body: "Each message reflects the student’s current progress and gives one clear, institution-approved next action.",
  },
  {
    time: "8:18 AM",
    icon: CheckCircle,
    title: "Staff review and move the work forward",
    body: "People approve consequential actions, students receive clear guidance, and every step remains traceable.",
  },
  {
    time: "This week",
    icon: Chart,
    title: "Leadership sees enrollment readiness advance",
    body: "The same operating picture shows progress by cohort, team, milestone, and agreed pilot measure.",
  },
];

export function ProductStory() {
  return (
    <div className="au-story">
      <div className="au-story__summary">
        <span>Illustrative product story</span>
        <strong>One signal. One coordinated institutional response.</strong>
        <p>
          The figures below demonstrate the workflow and are illustrative, not customer results.
        </p>
      </div>
      <ol className="au-story__steps">
        {story.map((step, index) => (
          <li key={step.title}>
            <span className="au-story__marker">
              <step.icon size={18} />
            </span>
            <div>
              <span className="au-story__time">{step.time}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
            <span className="au-story__number">{String(index + 1).padStart(2, "0")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
