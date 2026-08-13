import { Architecture } from "@/components/architecture";
import { JourneyRail } from "@/components/journey-rail";
import { BrewPulse } from "@/components/product/brew-pulse";
import { LiveActionCenter } from "@/components/product/live-action-center";
import { LiveEdward } from "@/components/product/live-edward";
import { LiveStudentJourney } from "@/components/product/live-student-journey";
import { MorningBrief } from "@/components/product/morning-brief";
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
   The enrollment gap
   ------------------------------------------------------------------------- */

const gaps = [
  {
    title: "Signals are scattered",
    body: "Intent shows up across the SIS, the CRM, financial aid, communications, events, web activity, and conversations staff have one at a time.",
  },
  {
    title: "Decisions arrive late",
    body: "Retrospective reporting explains the cycle after the window to influence it has closed.",
  },
  {
    title: "Action stays manual",
    body: "Even when someone spots the opportunity, prioritizing, coordinating, and reaching out happen across disconnected tools.",
  },
];

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
    promise: "Know what changed and where attention is needed.",
    body: "Goal pacing, emerging patterns, risks, and the opportunities worth someone's morning — assembled before anyone opens a spreadsheet.",
    items: [
      { title: "Pacing against the goals leadership actually tracks" },
      { title: "Patterns surfaced while there is still time to act on them" },
      { title: "A brief shaped to the reader's role, not one report for everyone" },
    ],
    href: "/platform/morning-brew",
    mock: <BrewPulse audience="staff" />,
  },
  {
    id: "edward",
    label: "EDward",
    stage: "Understand",
    promise: "Ask what is happening with a student, and why.",
    body: "Institution-grounded intelligence for understanding a student, a policy, a requirement, a blocker, or the next step — with the sources it drew from.",
    items: [
      { title: "Answers grounded in approved institutional information" },
      { title: "The student's own context, not a generic policy page" },
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
    body: "Prioritized work with the student context attached, routed to the office that can clear it, and closed with a record of what happened.",
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
    body: "A personalized enrollment path that shows a student what is done, what is open, and what to do next — across every office at once.",
    items: [
      { title: "One checklist instead of five office websites" },
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
    body: "Surface enrollment friction and missing requirements while there is runway to clear them.",
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
    body: "Replace an administrative maze with a personalized path and fewer unanswered questions.",
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
                Audentra helps enrollment teams see which students need attention, understand what is
                standing in their way, and coordinate the next action across Admissions, Financial
                Aid, Student Accounts, and Student Services &mdash; before enrollment opportunities
                are lost.
              </p>
              <p className="au-hero__tagline">Institutional intelligence for what&rsquo;s next.</p>
              <div className="au-btn-row">
                <Btn href="/demo" icon={<ArrowRight />}>
                  Request a Pilot
                </Btn>
                <Btn href="/why-audentra" variant="outlineLight" icon={<Play />}>
                  See How Audentra Works
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

      {/* ---------- 2. The enrollment gap ---------- */}
      <Section tone="paper">
        <SectionHead
          eyebrow="The enrollment gap"
          title="Your teams have the data. Audentra turns it into momentum."
          lede="The signals are already there. They live across the SIS, CRM, financial aid, communications, events, web activity, and conversations with students. The challenge is seeing those signals together, early enough to know which students need attention, what is standing in their way, and which office can change the outcome."
        />

        <Cols items={gaps} numbered />

        <div className="au-resolve">
          <strong>Audentra</strong>
          <span>Fragmented signals, one coordinated response</span>
          <p>
            Audentra turns fragmented institutional signals into coordinated action &mdash; inside
            institution-defined controls.
          </p>
        </div>
      </Section>

      {/* ---------- 3. The platform ---------- */}
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

      {/* ---------- 4. Outcomes ---------- */}
      <Section tone="paper" tight>
        <SectionHead
          eyebrow="Measurable by design"
          title="Measure Audentra by what changes — not how often people log in."
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

      {/* ---------- 5. Enrollment readiness example ---------- */}
      <Section tight>
        <SectionHead
          eyebrow="Where institutions start"
          title="The journey after deposit"
          lede="The enrollment journey continues after the deposit. From financial aid and student accounts to housing and orientation, important milestones remain. Audentra brings those milestones into one connected view so teams can coordinate support and students can move toward enrollment with confidence."
        />

        <JourneyRail />

        <div className="au-btn-row" style={{ justifyContent: "center" }}>
          <Btn href="/solutions/enrollment-readiness" variant="dark" icon={<ArrowRight />}>
            Explore Enrollment Readiness
          </Btn>
        </div>
      </Section>

      {/* ---------- 6. How it works ---------- */}
      <Section tone="navy" mesh tight>
        <SectionHead
          eyebrow="How it works"
          title={
            <>
              Keep your systems.
              <br />
              Connect the work between them.
            </>
          }
          lede="Your SIS, CRM, LMS, financial aid systems, communications platforms, and institutional knowledge remain where they are. Audentra connects the signals across them, adds institutional context, and turns that understanding into the next appropriate action. No rip-and-replace strategy. No new system of record."
          light
        />
        <Architecture />
      </Section>

      {/* ---------- 7. Enterprise trust ---------- */}
      <Section tone="paper" tight>
        <SectionHead
          eyebrow="Enterprise trust"
          title="Intelligence your institution can govern."
          lede="AI should increase institutional capacity without reducing institutional accountability. These are the principles the platform is designed around. We review current implementation status, security documentation, and data handling directly with each institution."
        />
        <Cols items={trust} />
      </Section>

      {/* ---------- 8. Final pilot CTA ---------- */}
      <CtaBand
        eyebrow="Start with one measurable enrollment problem"
        title="Start with a student journey that matters."
        lede="Focus Audentra on a priority cohort and a meaningful point in the student journey. Give your teams greater visibility and coordination, create a clearer experience for students, and use what you learn to guide what comes next."
        primary={{ href: "/demo", label: "Request an Enrollment Readiness Pilot" }}
        secondary={{ href: "/solutions/enrollment-readiness", label: "Explore Enrollment Readiness" }}
      />
    </>
  );
}
