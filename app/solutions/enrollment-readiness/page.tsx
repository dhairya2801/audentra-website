import type { Metadata } from "next";
import { JourneyRail } from "@/components/journey-rail";
import { ActionCenter, StudentJourney } from "@/components/product/mocks";
import {
  ArrowRight,
  Chart,
  CheckCircle,
  Mail,
  Route,
  Search,
  Sort,
  Target,
} from "@/components/icons";
import {
  Btn,
  CampusPhoto,
  CheckList,
  Cols,
  CtaBand,
  PageHero,
  Section,
  SectionHead,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Enrollment Readiness",
  description:
    "Deposited doesn't mean enrolled. Audentra helps enrollment teams identify barriers earlier, prioritize the students who need attention, and coordinate the offices that can clear the path to enrollment.",
};

/* The questions a buyer arrives with. Stated in their words, before ours. */
const buyerQuestions = [
  "Which deposited students are actually on track to enroll?",
  "Where is enrollment friction accumulating?",
  "Which students need intervention this week?",
  "Which office owns the blocker?",
  "Are our interventions changing the outcome?",
  "Where are students getting stuck across departments?",
];

const process = [
  { icon: Search, title: "Identify", body: "Surface unresolved requirements and emerging risk." },
  { icon: Sort, title: "Prioritize", body: "Rank students by deadline pressure and open items." },
  { icon: Route, title: "Coordinate", body: "Route work to the office that can actually clear it." },
  { icon: Mail, title: "Engage", body: "Reach students with specific, deadline-aware guidance." },
  { icon: CheckCircle, title: "Resolve", body: "Close the requirement and confirm the record." },
  { icon: Chart, title: "Measure", body: "Compare cohort movement against the baseline." },
];

const outcomes = [
  {
    icon: Target,
    title: "Risk surfaces sooner",
    body: "Unresolved requirements appear as work while there is still runway to act on them, rather than in a post-census report.",
  },
  {
    icon: Route,
    title: "Handoffs stop stalling",
    body: "Cross-office dependencies are explicit, so a student waiting on two departments is visible to both.",
  },
  {
    icon: Chart,
    title: "Movement is measurable",
    body: "Cohort progress is tracked against a baseline your institutional research office can verify.",
  },
];

export default function EnrollmentReadinessPage() {
  return (
    <>
      <PageHero
        eyebrow="Enrollment Readiness"
        title="Deposited doesn't mean enrolled."
        lede={
          <>
            Between admission and enrollment, unresolved financial aid, documents, accounts, housing,
            orientation, and other requirements can quietly turn committed students into melt.
            <br />
            <br />
            Audentra helps enrollment teams identify those barriers earlier, prioritize the students
            who need attention, and coordinate the offices that can clear the path to enrollment.
          </>
        }
        actions={
          <>
            <Btn href="/pilot" icon={<ArrowRight />}>
              Explore an Enrollment Readiness Pilot
            </Btn>
            <Btn href="/why-audentra" variant="outlineLight">
              See How Audentra Works
            </Btn>
          </>
        }
      />

      {/* Who this is for */}
      <Section tone="paper" tight>
        <SectionHead
          eyebrow="Who this is for"
          title="Enrollment Readiness is built for institutions asking:"
        />
        <ul className="au-questions au-questions--center">
          {buyerQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </Section>

      {/* Problem */}
      <Section>
        <SectionHead
          eyebrow="The problem"
          title="One student. Multiple systems. Multiple offices. One enrollment decision."
          lede="Between admission and enrollment, a single student passes through six offices and at least as many systems. Nobody owns the whole path — which is exactly where students are lost."
        />

        <JourneyRail />

        <p className="au-body" style={{ marginTop: "1.5rem", textAlign: "center" }}>
          Audentra sits across the journey rather than inside one stop on it.
        </p>
      </Section>

      {/* Process */}
      <Section tone="paper">
        <SectionHead
          eyebrow="The operating loop"
          title="A loop your team runs daily, not a report they read quarterly."
          lede="Six moves, repeated through every day of the melt window. Each one hands off to the next with the student context still attached."
        />
        <div className="au-process">
          {process.map((step) => (
            <div className="au-process__item" key={step.title}>
              <step.icon size={24} />
              <b>{step.title}</b>
              <span>{step.body}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* In product */}
      <Section tone="navy" mesh>
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow au-eyebrow--light">In the product</span>
            <h2 className="au-h2">Turn the melt window into an operating workflow.</h2>
            <p className="au-lede">
              Readiness is not a dashboard number. Every percentage point resolves to named students,
              named blockers, and a named owner in the office that can clear it.
            </p>
            <CheckList
              items={[
                {
                  title: "Readiness scoring by cohort",
                  body: "Which admitted students are actually on track to enroll.",
                },
                {
                  title: "Blocker breakdown by office",
                  body: "Financial clearance, documents, deposits, immunization, housing.",
                },
                {
                  title: "Outreach that references the real blocker",
                  body: "Drafted by EDward, reviewed and sent by staff.",
                },
                {
                  title: "Movement you can measure",
                  body: "Cohort progress against a baseline agreed before the pilot starts.",
                },
              ]}
            />
          </div>
          <div style={{ display: "grid", gap: "1rem" }}>
            <ActionCenter title="Readiness queue" />
            <StudentJourney />
          </div>
        </div>
      </Section>

      {/* Pilot framing */}
      <Section tone="paper">
        <div className="au-featurerow au-featurerow--flip">
          <div>
            <span className="au-eyebrow">How institutions start</span>
            <h2 className="au-h2">A defined cohort. A defined workflow. A defined measure.</h2>
            <p className="au-lede">
              An Enrollment Readiness Pilot is scoped small enough to run inside one cycle and specific
              enough to prove or disprove the value.
            </p>
            <CheckList
              items={[
                { title: "A defined cohort", body: "One population, agreed before configuration begins." },
                { title: "Selected workflows", body: "The two or three requirements that drive the most melt." },
                { title: "Participating departments", body: "The offices that must coordinate to clear them." },
                { title: "Success measures", body: "Agreed criteria, reviewed with your executive sponsor." },
              ]}
            />
            <div className="au-btn-row">
              <Btn href="/pilot" variant="dark" icon={<ArrowRight />}>
                See the Pilot Program
              </Btn>
            </div>
          </div>

          <CampusPhoto
            alt="A university campus on a clear morning"
            title="What a pilot looks like"
            items={[
              "One cohort, one melt window",
              "Baseline agreed before go-live",
              "Weekly operating review with your team",
              "Executive readout at the end of the cycle",
            ]}
          />
        </div>
      </Section>

      <Section tone="navy" mesh tight>
        <SectionHead
          eyebrow="What changes"
          title="Earlier signal, faster resolution, fewer students lost to friction."
          lede="The measures that matter are agreed with your team before a pilot begins, and compared against your own baseline rather than an industry benchmark."
          light
        />
        <Cols items={outcomes} />
      </Section>

      <CtaBand
        title="See what enrollment readiness could look like at your institution."
        lede="Bring your melt numbers. We'll show you where Audentra would have surfaced the risk."
        primary={{ href: "/demo", label: "Request an Enrollment Readiness Pilot" }}
        secondary={{ href: "/pilot", label: "See How the Pilot Works" }}
      />
    </>
  );
}
