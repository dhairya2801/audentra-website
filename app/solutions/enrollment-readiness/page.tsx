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
    "Audentra Enrollment Readiness gives teams one current view from deposit through enrollment and coordinates timely support across every participating office.",
};

/* The questions a buyer arrives with. Stated in their words, before ours. */
const buyerQuestions = [
  "How many deposited students are on track to enroll?",
  "Where can timely institutional support advance progress?",
  "Which students would benefit from coordinated support this week?",
  "Which team is best positioned to move the next step forward?",
  "How is our support changing enrollment readiness?",
  "Where can cross-office coordination strengthen the journey?",
];

const process = [
  { icon: Search, title: "Identify", body: "Bring current progress and next milestones into view." },
  { icon: Sort, title: "Prioritize", body: "Focus support around timing, context, and opportunity." },
  { icon: Route, title: "Coordinate", body: "Connect each next step with the best-positioned office." },
  { icon: Mail, title: "Engage", body: "Reach students with specific, deadline-aware guidance." },
  { icon: CheckCircle, title: "Advance", body: "Complete the milestone and confirm the shared record." },
  { icon: Chart, title: "Measure", body: "Compare cohort movement against the baseline." },
];

const outcomes = [
  {
    icon: Target,
    title: "Opportunities appear sooner",
    body: "Upcoming milestones become coordinated work while there is time to provide meaningful support.",
  },
  {
    icon: Route,
    title: "Handoffs stay connected",
    body: "Cross-office dependencies are explicit, so participating teams share the same view of progress.",
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
        eyebrow="Audentra Enrollment Readiness™"
        title="Give every deposit a clear path to enrollment."
        lede={
          <>
            Between admission and enrollment, students move through financial aid, documents,
            accounts, housing, orientation, and other important milestones.
            <br />
            <br />
            Audentra gives enrollment teams a current readiness picture, highlights where timely
            support can build momentum, and coordinates the teams that can move each next step forward.
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

      {/* Opportunity */}
      <Section>
        <SectionHead
          eyebrow="The opportunity"
          title="One student. Multiple systems. Multiple offices. One enrollment decision."
          lede="Between admission and enrollment, a student may connect with six offices and as many systems. Audentra gives every participating team a shared view of the whole path."
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
          title="A daily loop that keeps student progress moving."
          lede="Six connected moves, repeated throughout the enrollment cycle. Each one hands off to the next with the student context still attached."
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
            <h2 className="au-h2">Turn enrollment readiness into an operating workflow.</h2>
            <p className="au-lede">
              Every readiness measure connects to named students, upcoming milestones, and the team
              best positioned to move the next step forward.
            </p>
            <CheckList
              items={[
                {
                  title: "Readiness scoring by cohort",
                  body: "Which admitted students are actually on track to enroll.",
                },
                {
                  title: "Milestone view by office",
                  body: "Financial clearance, documents, deposits, immunization, and housing.",
                },
                {
                  title: "Outreach grounded in current progress",
                  body: "Prepared by EDward, reviewed and sent by staff.",
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
                { title: "Selected workflows", body: "The two or three milestones with the greatest opportunity for progress." },
                { title: "Participating departments", body: "The offices that coordinate around those milestones." },
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
              "One cohort, one enrollment cycle",
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
          title="Earlier visibility. Faster coordination. Greater student confidence."
          lede="The measures that matter are agreed with your team before a pilot begins, and compared against your own baseline rather than an industry benchmark."
          light
        />
        <Cols items={outcomes} />
      </Section>

      <CtaBand
        title="See what enrollment readiness could look like at your institution."
        lede="Bring a priority cohort and the measures that matter. We'll show you how Audentra would connect the journey."
        primary={{ href: "/demo", label: "Request an Enrollment Readiness Pilot" }}
        secondary={{ href: "/pilot", label: "See How the Pilot Works" }}
      />
    </>
  );
}
