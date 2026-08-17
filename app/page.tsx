import { Architecture } from "@/components/architecture";
import { JourneyRail } from "@/components/journey-rail";
import { BrewPulse } from "@/components/product/brew-pulse";
import { LiveActionCenter } from "@/components/product/live-action-center";
import { LiveEdward } from "@/components/product/live-edward";
import { LiveStudentJourney } from "@/components/product/live-student-journey";
import { MorningBrief } from "@/components/product/morning-brief";
import { ProductStory } from "@/components/product-story";
import { SignalFlow } from "@/components/signal-flow";
import { Tabs } from "@/components/tabs";
import {
  ArrowRight,
  Check,
  Clock,
  Eye,
  Handshake,
  Network,
  Play,
  Shield,
  Users,
} from "@/components/icons";
import {
  Btn,
  CheckList,
  Cols,
  Container,
  CtaBand,
  Section,
  SectionHead,
  Waves,
} from "@/components/ui";

/* -------------------------------------------------------------------------
   Platform — the four products, ordered as a progression.

   The stage verb leads; the product name sits under it. A first-time buyer
   should be able to read the architecture before learning four brand names.
   ------------------------------------------------------------------------- */

const capabilityTabs = [
  {
    id: "morning-brew",
    label: "Morning Brew",
    stage: "See",
    promise: "Know what changed and where timely support can create momentum.",
    body: "Goal pacing, emerging patterns, and the opportunities worth someone's morning — assembled into one role-aware view.",
    items: [
      { title: "Pacing against the goals leadership actually tracks" },
      { title: "Patterns surfaced while there is still time to act on them" },
      { title: "A briefing shaped to each reader's role" },
    ],
    href: "/platform/morning-brew",
    mock: <BrewPulse audience="staff" />,
  },
  {
    id: "edward",
    label: "EDward",
    stage: "Understand",
    promise: "Ask what is happening with a student, and why.",
    body: "Institution-grounded intelligence for understanding a student, a policy, a requirement, or the next step — with the sources it drew from.",
    items: [
      { title: "Answers grounded in approved institutional information" },
      { title: "The student's own context alongside institutional policy" },
      { title: "Drafted messages and tasks that wait for staff review" },
    ],
    href: "/platform/edward",
    mock: <LiveEdward height="19rem" />,
  },
  {
    id: "action-center",
    label: "Action Center",
    stage: "Act",
    promise: "Turn insight into owned, coordinated work.",
    body: "Prioritized work with the student context attached, routed to the best-positioned office, and completed with a record of what happened.",
    items: [
      { title: "Owner, due date, status, and department on every item" },
      { title: "Cross-office dependencies made explicit" },
      { title: "Consequential actions gated behind a person" },
    ],
    href: "/platform/action-center",
    mock: <LiveActionCenter />,
  },
  {
    id: "student",
    label: "Student Experience",
    stage: "Guide",
    promise: "Give students one clear path forward.",
    body: "A personalized enrollment path that shows a student what is complete, what comes next, and where support is available — across every office at once.",
    items: [
      { title: "One connected checklist across participating offices" },
      { title: "Progress a student can actually see" },
      { title: "Answers on demand, with a human handoff when it matters" },
    ],
    href: "/platform/student-experience",
    mock: <LiveStudentJourney />,
  },
];

/* -------------------------------------------------------------------------
   Outcomes
   ------------------------------------------------------------------------- */

const outcomes = [
  {
    title: "Improve yield",
    body: "Find the students where timely, specific support can still move an offer to a deposit.",
    from: "Offer",
    to: "Deposit",
  },
  {
    title: "Accelerate completion",
    body: "Bring each enrollment milestone into view while there is time to offer useful support.",
    from: "Intent",
    to: "Completion",
  },
  {
    title: "Focus staff effort",
    body: "Rank conversations and cases by likely impact and urgency rather than by arrival order.",
    from: "Queue",
    to: "Impact",
  },
  {
    title: "Build student confidence",
    body: "Give every student a personalized path with clear progress and timely answers.",
    from: "Question",
    to: "Clarity",
  },
];

/* -------------------------------------------------------------------------
   Trust — stated as the principles the platform is designed around
   ------------------------------------------------------------------------- */

const trust = [
  {
    icon: Users,
    title: "Role-based access",
    body: "People see only the student information and capabilities appropriate to their role.",
  },
  {
    icon: Handshake,
    title: "Human approval",
    body: "Institution-defined approval gates separate a recommendation from a consequential action.",
  },
  {
    icon: Eye,
    title: "Auditability",
    body: "Recommendations, decisions, and actions are designed to be traceable after the fact.",
  },
  {
    icon: Shield,
    title: "AI governance",
    body: "Institutions define the policies, boundaries, and appropriate uses of AI on their own terms.",
  },
];

const pilotMeasures = [
  { label: "Enrollment readiness", baseline: "81%", target: "88%" },
  { label: "Average requirement completion", baseline: "4.2 days", target: "Under 3 days" },
  { label: "Guided milestones completed", baseline: "1,240", target: "+20%" },
  { label: "Staff time preparing priorities", baseline: "8 hrs/week", target: "Under 2 hrs/week" },
];

export default function HomePage() {
  return (
    <>
      {/* ---------- 1. Hero + intelligence demonstration ---------- */}
      <header className="au-hero au-mesh">
        <Waves />
        <Container>
          <div className="au-hero__inner">
            <div>
              <span className="au-eyebrow au-eyebrow--light">
                Institutional Intelligence for Higher Education
              </span>
              <h1 className="au-display">
                Turn student intent
                <br />
                into <span className="au-gradient-text">enrollment.</span>
              </h1>
              <p className="au-lede">
                Audentra gives enrollment teams one current view of each student&rsquo;s progress,
                highlights where timely support can strengthen momentum, and coordinates the next
                action across Admissions, Financial Aid, Student Accounts, and Student Services.
              </p>
              <p className="au-hero__tagline">Institutional intelligence for what&rsquo;s next.</p>
              <div className="au-btn-row">
                <Btn href="/demo" icon={<ArrowRight />}>
                  See Audentra in Action
                </Btn>
                <Btn href="/solutions/enrollment-readiness" variant="outlineLight" icon={<Play />}>
                  Explore Enrollment Readiness
                </Btn>
              </div>

              <ul className="au-hero__points">
                <li>
                  <Network size={16} />
                  Works with the systems you already have
                </li>
                <li>
                  <Clock size={16} />
                  Coordinated next action across offices
                </li>
                <li>
                  <Check size={16} />
                  Human approval where it matters
                </li>
              </ul>
            </div>

            <MorningBrief />
          </div>

          <SignalFlow tone="dark" />
        </Container>
      </header>

      {/* ---------- 2. Enrollment Readiness wedge ---------- */}
      <Section tight>
        <SectionHead
          eyebrow="Where institutions start"
          title="Make Enrollment Readiness visible, measurable, and actionable."
          lede="From deposit to enrollment, every milestone is an opportunity to give students clarity and help offices move together. Audentra brings financial aid, documents, student accounts, housing, and orientation into one connected operating view."
        />

        <JourneyRail />

        <div className="au-btn-row" style={{ justifyContent: "center" }}>
          <Btn href="/solutions/enrollment-readiness" variant="dark" icon={<ArrowRight />}>
            Explore Enrollment Readiness
          </Btn>
        </div>
      </Section>

      {/* ---------- 3. Existing systems + defining architecture ---------- */}
      <Section tone="navy" mesh tight>
        <SectionHead
          eyebrow="How Audentra fits"
          title={
            <>
              Keep your systems.
              <br />
              Connect the work between them.
            </>
          }
          lede="Your SIS, CRM, LMS, financial aid systems, communications platforms, and institutional knowledge remain where they are. Audentra connects their signals, adds institutional context, and coordinates the next appropriate action across leadership, enrollment teams, and students."
          light
        />
        <Architecture />
      </Section>

      {/* ---------- 4. Concrete product story ---------- */}
      <Section tone="paper">
        <SectionHead
          eyebrow="Audentra in action"
          title="See an enrollment morning move from signal to measurable progress."
          lede="A 90-second product story showing how Audentra connects context, focuses staff attention, coordinates work, supports students, and measures enrollment readiness."
        />
        <ProductStory />
      </Section>

      {/* ---------- 5. The platform ---------- */}
      <Section id="platform">
        <SectionHead
          eyebrow="The Audentra platform"
          title="Four experiences. One shared understanding of the student."
          lede="See, understand, act, guide. Each surface reads from the same institutional context, so a leader's brief, a counselor's answer, and a student's checklist never disagree."
        />
        <Tabs
          label="Platform capabilities"
          tabs={capabilityTabs.map((tab) => ({
            id: tab.id,
            label: tab.stage,
            content: (
              <div className="au-featurerow">
                <div>
                  <h3 className="au-h3">{tab.label}</h3>
                  <p className="au-lede">
                    <strong>{tab.promise}</strong> {tab.body}
                  </p>
                  <CheckList items={tab.items} />
                  <div className="au-btn-row">
                    <Btn href={tab.href} variant="outline" icon={<ArrowRight />}>
                      Explore {tab.label}
                    </Btn>
                  </div>
                </div>
                {tab.mock}
              </div>
            ),
          }))}
        />
      </Section>

      {/* ---------- 6. Outcomes ---------- */}
      <Section tone="paper" tight>
        <SectionHead
          eyebrow="Measurable by design"
          title="Measure Audentra by the progress your institution creates."
        />
        <div className="au-outcomes">
          {outcomes.map((outcome, index) => (
            <div key={outcome.title}>
              <span className="au-outcomes__key">{String(index + 1).padStart(2, "0")}</span>
              <h3>{outcome.title}</h3>
              <p>{outcome.body}</p>
              <span className="au-outcomes__shift">
                {outcome.from} <b>&rarr;</b> {outcome.to}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- 7. Illustrative pilot proof ---------- */}
      <Section tone="navy" mesh tight>
        <SectionHead
          eyebrow="Pilot success measures"
          title="Define success before implementation begins."
          lede="Every pilot starts with an institution-approved baseline and target. These examples show how the measures can be made concrete; they are illustrative pilot measures, not customer outcomes."
          light
        />
        <div className="au-measures">
          {pilotMeasures.map((measure) => (
            <div key={measure.label}>
              <span>{measure.label}</span>
              <p>
                <small>Illustrative baseline</small>
                <strong>{measure.baseline}</strong>
              </p>
              <b aria-hidden="true">&rarr;</b>
              <p>
                <small>Illustrative target</small>
                <strong>{measure.target}</strong>
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- 8. Enterprise trust ---------- */}
      <Section tone="paper" tight>
        <SectionHead
          eyebrow="Enterprise trust"
          title="Intelligence your institution can govern."
          lede="AI can increase institutional capacity while preserving institutional accountability. Audentra is designed around clear permissions, human approval, traceability, and institution-defined governance."
        />
        <Cols items={trust} />
        <div className="au-btn-row" style={{ justifyContent: "center" }}>
          <Btn href="/trust" variant="outline" icon={<ArrowRight />}>
            Visit the Trust Center
          </Btn>
        </div>
      </Section>

      {/* ---------- 9. Final pilot CTA ---------- */}
      <CtaBand
        eyebrow="Start with one measurable enrollment priority"
        title="Start with a student journey that matters."
        lede="Focus Audentra on a priority cohort and a meaningful point in the student journey. Give your teams greater visibility and coordination, create a clearer experience for students, and use what you learn to guide what comes next."
        primary={{ href: "/demo", label: "Request an Enrollment Readiness Pilot" }}
        secondary={{ href: "/solutions/enrollment-readiness", label: "Explore Enrollment Readiness" }}
      />
    </>
  );
}
