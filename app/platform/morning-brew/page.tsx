import type { Metadata } from "next";
import { BrewPulse } from "@/components/product/brew-pulse";
import { ArrowRight, Chart, Clock, Users } from "@/components/icons";
import { Btn, CtaBand, PageHero, Section, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Morning Brew — daily institutional intelligence",
  description:
    "Morning Brew gives each user a focused view of the institutional activity that deserves attention today.",
};

const views = [
  {
    icon: Users,
    audience: "staff" as const,
    title: "Staff Morning Brew",
    items: ["Today's work", "Priority students", "Due dates", "Communications", "Open actions"],
  },
  {
    icon: Chart,
    audience: "leader" as const,
    title: "Leader Morning Brew",
    items: ["Team workload", "Service levels", "Bottlenecks", "Enrollment movement", "Escalations"],
  },
  {
    icon: Clock,
    audience: "executive" as const,
    title: "Executive Morning Brew",
    items: [
      "Enrollment funnel",
      "Institutional trends",
      "Operational risk",
      "Resource efficiency",
      "Strategic priorities",
    ],
  },
];

export default function MorningBrewPage() {
  return (
    <>
      <PageHero
        eyebrow="Morning Brew"
        title="Start the day knowing what matters."
        lede="Morning Brew gives each user a focused view of the institutional activity that deserves attention today — assembled before anyone opens a spreadsheet."
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              See Morning Brew
            </Btn>
            <Btn href="/#capabilities" variant="outlineLight">
              See all capabilities
            </Btn>
          </>
        }
        aside={<BrewPulse audience="staff" />}
      />

      <Section>
        <SectionHead
          eyebrow="Three views"
          title="The same institution, at three altitudes."
          lede="Everyone opens the same product. Nobody opens the same briefing."
        />
        <div className="au-grid au-grid--3">
          {views.map((view) => (
            <div key={view.title}>
              <div className="au-card" style={{ marginBottom: "1rem" }}>
                <span className="au-icon">
                  <view.icon />
                </span>
                <h3 className="au-h4">{view.title}</h3>
                <ul style={{ margin: "0.85rem 0 0", padding: 0, listStyle: "none" }}>
                  {view.items.map((item) => (
                    <li
                      key={item}
                      style={{
                        padding: "0.35rem 0",
                        borderTop: "1px solid var(--au-line-soft)",
                        color: "var(--au-ink-soft)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <BrewPulse audience={view.audience} />
            </div>
          ))}
        </div>
      </Section>

      <Section tone="navy" mesh tight>
        <div className="au-section-head">
          <h2 className="au-h1">
            Less time assembling the picture.
            <br />
            More time improving it.
          </h2>
          <p className="au-lede">
            Most institutional reporting is reconstructed by hand every week. Morning Brew removes the
            assembly step so the meeting starts at the decision.
          </p>
          <div className="au-btn-row" style={{ justifyContent: "center" }}>
            <Btn href="/demo" variant="light" icon={<ArrowRight />}>
              Request a Demo
            </Btn>
          </div>
        </div>
      </Section>

      <CtaBand
        title="See tomorrow's brief for your enrollment team."
        lede="We'll build a sample from a workflow you actually run."
        secondary={{ href: "/platform/student-experience", label: "Next: Student Experience" }}
      />
    </>
  );
}
