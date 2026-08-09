import { BrewPulse } from "@/components/product/brew-pulse";
import { LiveActionCenter } from "@/components/product/live-action-center";
import { LiveEdward } from "@/components/product/live-edward";
import { LiveReadiness } from "@/components/product/live-readiness";
import { LiveStudentJourney } from "@/components/product/live-student-journey";
import { ReadinessOverview } from "@/components/product/mocks";
import { JourneyRail } from "@/components/journey-rail";
import { Tabs } from "@/components/tabs";
import {
  ArrowRight,
  Bolt,
  Chart,
  Compass,
  Layers,
  Lightbulb,
  Mail,
  Network,
  Play,
  Pulse,
  Puzzle,
  Route,
  Shield,
  Target,
} from "@/components/icons";
import {
  Btn,
  CheckList,
  Cols,
  Container,
  CtaBand,
  LinkList,
  Section,
  SectionHead,
  Waves,
} from "@/components/ui";

const operatingModel = [
  {
    icon: Network,
    title: "Connect",
    body: "Bring together relevant information from existing institutional systems and approved knowledge.",
  },
  {
    icon: Lightbulb,
    title: "Understand",
    body: "Translate information into context, trends, risks, and opportunities.",
  },
  {
    icon: Compass,
    title: "Prioritize",
    body: "Surface what deserves attention and why.",
  },
  {
    icon: Route,
    title: "Coordinate",
    body: "Connect work across people, departments, and workflows.",
  },
  {
    icon: Bolt,
    title: "Act",
    body: "Use human-directed and AI-assisted tools to move work forward.",
  },
];

const secondary = [
  {
    icon: Pulse,
    title: "Enrollment Intelligence",
    body: "Risk signals, cohort movement, and readiness scoring across the admit-to-enrolled journey.",
  },
  {
    icon: Mail,
    title: "Communications",
    body: "Assisted, personalized outreach grounded in institutional information and reviewed by staff.",
  },
  {
    icon: Layers,
    title: "Institutional Knowledge",
    body: "Approved policies, requirements, and procedures made retrievable in the moment of work.",
  },
  {
    icon: Chart,
    title: "Role-Based Dashboards",
    body: "Staff, leader, and executive views built on the same underlying institutional truth.",
  },
];

const products = [
  {
    name: "EDward",
    kicker: "Institutional AI assistant",
    body: "The AI assistant built around your institution.",
    href: "/platform/edward",
  },
  {
    name: "Action Center",
    kicker: "Operational work management",
    body: "Every important action needs an owner.",
    href: "/platform/action-center",
  },
  {
    name: "Morning Brew",
    kicker: "Daily institutional intelligence",
    body: "Start the day knowing what matters.",
    href: "/platform/morning-brew",
  },
  {
    name: "Student Experience",
    kicker: "Guided enrollment journey",
    body: "Enrollment shouldn't feel like a scavenger hunt.",
    href: "/platform/student-experience",
  },
];

const differentiators = [
  {
    icon: Puzzle,
    title: "Built for higher education",
    body: "Purpose-built around institutional workflows, student journeys, and cross-departmental work.",
  },
  {
    icon: Layers,
    title: "Works with your existing systems",
    body: "Audentra augments your technology environment rather than requiring you to replace your CRM or SIS.",
  },
  {
    icon: Target,
    title: "Intelligence that leads to action",
    body: "Move beyond reports and dashboards into prioritized, coordinated workflows.",
  },
  {
    icon: Shield,
    title: "Human-governed AI",
    body: "Use AI to increase staff capacity while maintaining institutional permissions, oversight, and accountability.",
  },
];

const capabilityTabs = [
  {
    id: "edward",
    label: "EDward",
    eyebrow: "Institutional AI assistant",
    title: "Ask. Understand. Act.",
    body: "A conversational assistant that helps staff and students understand institutional information, surface relevant context, and determine what should happen next.",
    items: [
      { title: "Plain-language questions about students, policies, and requirements" },
      { title: "Answers grounded in approved institutional sources" },
      { title: "Drafted outreach and tasks, always reviewed by a person" },
    ],
    mock: <LiveEdward height="19rem" />,
  },
  {
    id: "action-center",
    label: "Action Center",
    eyebrow: "Operational work management",
    title: "Turn priorities into action.",
    body: "Organize institutional work around clear owners, deadlines, statuses, priorities, and student context — across departments rather than inside one of them.",
    items: [
      { title: "Owner, due date, status, and department on every item" },
      { title: "Dependencies across offices made explicit" },
      { title: "Activity history for anything that needs review" },
    ],
    mock: <LiveActionCenter />,
  },
  {
    id: "morning-brew",
    label: "Morning Brew",
    eyebrow: "Daily institutional intelligence",
    title: "Start the day knowing what matters.",
    body: "Role-specific daily intelligence gives staff and leaders a focused view of priorities, risks, workload, and emerging issues — without assembling it by hand.",
    items: [
      { title: "Staff: today's work, priority students, deadlines, communications" },
      { title: "Leaders: team workload, service levels, bottlenecks, escalations" },
      { title: "Executives: funnel movement, trends, operational risk" },
    ],
    mock: <BrewPulse audience="staff" />,
  },
  {
    id: "student",
    label: "Student Experience",
    eyebrow: "Guided enrollment journey",
    title: "Give every student a clearer next step.",
    body: "Bring enrollment requirements, documents, financial information, progress, and support into one coordinated experience.",
    items: [
      { title: "One checklist across every office" },
      { title: "Progress students can actually see" },
      { title: "Answers on demand, with a human handoff when needed" },
    ],
    mock: <LiveStudentJourney />,
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <header className="au-hero au-mesh">
        <Waves />
        <Container>
          <div className="au-hero__inner">
            <div>
              <span className="au-eyebrow au-eyebrow--light">Higher Education Intelligence Platform</span>
              <h1 className="au-display">
                Institutional intelligence
                <br />
                for <span className="au-gradient-text">what&rsquo;s next.</span>
              </h1>
              <p className="au-lede">
                Audentra connects institutional data, workflows, and people so colleges and
                universities can see what matters, coordinate action, and move work forward.
              </p>
              <div className="au-btn-row">
                <Btn href="/demo" icon={<ArrowRight />}>
                  Request a Demo
                </Btn>
                <Btn href="#capabilities" variant="outlineLight" icon={<Play />}>
                  Explore the Platform
                </Btn>
              </div>
            </div>

            <LiveReadiness />
          </div>
        </Container>
      </header>

      {/* ---------- Platform operating model ---------- */}
      <Section>
        <SectionHead
          eyebrow="Platform operating model"
          title="Insight is only worth anything if it has somewhere to go."
          lede="Most higher-ed technology stops after the first two steps and hands you a dashboard. Audentra runs all five, so what the data says turns into work someone owns."
        />
        <Cols items={operatingModel} numbered />
      </Section>

      {/* ---------- The problem ---------- */}
      <Section tone="paper">
        <SectionHead
          eyebrow="The problem"
          title={
            <>
              Your systems hold the data.
              <br />
              Your people still connect the dots.
            </>
          }
          lede="Higher education has invested heavily in CRMs, student information systems, financial aid platforms, communication tools, and analytics. But the work between those systems still depends on people searching, reconciling, interpreting, and coordinating information manually."
        />

        <div className="au-flow">
          <div className="au-flow__col">
            <span className="au-flow__chip">CRM</span>
            <span className="au-flow__chip">Student Information System</span>
            <span className="au-flow__chip">Financial Aid</span>
            <span className="au-flow__chip">Email &amp; communications</span>
          </div>
          <span className="au-flow__arrow" aria-hidden="true">
            <ArrowRight size={26} />
          </span>
          <div className="au-flow__core">
            <strong>Audentra</strong>
            <span>The intelligence layer between information and action</span>
          </div>
          <span className="au-flow__arrow" aria-hidden="true">
            <ArrowRight size={26} />
          </span>
          <div className="au-flow__col">
            <span className="au-flow__chip">Staff</span>
            <span className="au-flow__chip">Leaders</span>
            <span className="au-flow__chip">Executives</span>
            <span className="au-flow__chip">Students</span>
          </div>
        </div>
      </Section>

      {/* ---------- Platform capabilities ---------- */}
      <Section id="capabilities">
        <SectionHead
          eyebrow="Platform capabilities"
          title="Four surfaces where the work actually happens."
          lede="Each capability is a different entry point into the same institutional truth."
        />
        <Tabs
          label="Platform capabilities"
          tabs={capabilityTabs.map((tab) => ({
            id: tab.id,
            label: tab.label,
            content: (
              <div className="au-featurerow">
                <div>
                  <span className="au-eyebrow">{tab.eyebrow}</span>
                  <h3 className="au-h3">{tab.title}</h3>
                  <p className="au-lede">{tab.body}</p>
                  <CheckList items={tab.items} />
                </div>
                {tab.mock}
              </div>
            ),
          }))}
        />
      </Section>

      {/* ---------- Secondary capabilities ---------- */}
      <Section tone="paper">
        <SectionHead
          eyebrow="Also included"
          title="The capabilities that hold it together."
          lede="Supporting layers that make the four core surfaces work as one system."
        />
        <Cols items={secondary} />
      </Section>

      {/* ---------- Built to integrate ---------- */}
      <Section tone="navy" mesh>
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow au-eyebrow--light">Built to integrate</span>
            <h2 className="au-h2">Designed to sit on top of what you already own.</h2>
            <p className="au-lede">
              Audentra augments your technology environment rather than requiring you to replace your
              CRM or SIS. Start with one workflow and one cohort, then expand as the value is proven.
            </p>
            <CheckList
              items={[
                {
                  title: "Works alongside your CRM and SIS",
                  body: "Existing systems remain the systems of record.",
                },
                {
                  title: "Role-aware access by design",
                  body: "Students, staff, leaders, and executives see what their role permits.",
                },
                {
                  title: "Institutional data isolation",
                  body: "Each institution's information remains logically separated.",
                },
              ]}
            />
            <div className="au-btn-row">
              <Btn href="/trust" variant="light" icon={<ArrowRight />}>
                Read about trust and governance
              </Btn>
            </div>
          </div>
          <ReadinessOverview />
        </div>
      </Section>

      {/* ---------- Enrollment wedge ---------- */}
      <Section>
        <SectionHead
          eyebrow="Enrollment readiness"
          title="Deposited doesn't always mean enrolled."
          lede="Between admission and enrollment, students navigate financial aid, documents, deposits, account requirements, onboarding, deadlines, and multiple institutional offices. Audentra helps teams see where students are getting stuck before an unresolved issue becomes enrollment melt."
        />

        <JourneyRail />

        <div className="au-btn-row" style={{ justifyContent: "center" }}>
          <Btn href="/solutions/enrollment-readiness" variant="dark" icon={<ArrowRight />}>
            Explore Enrollment Readiness
          </Btn>
        </div>
      </Section>

      {/* ---------- Product index ---------- */}
      <Section>
        <SectionHead title="Go deeper on any product." />
        <LinkList items={products} />
      </Section>

      {/* ---------- Why Audentra ---------- */}
      <Section tone="navy" mesh id="why-audentra">
        <SectionHead
          eyebrow="Why Audentra"
          title="Built differently for higher education."
          lede="We are not selling AI for colleges. We are selling institutional intelligence that helps colleges understand what matters and move work forward."
          light
        />
        <Cols items={differentiators} />
      </Section>

      {/* ---------- Final CTA ---------- */}
      <CtaBand
        title="Your institution already has the information."
        sub="Audentra helps you put it to work."
        lede="See how connected intelligence can help your institution understand what matters, coordinate work, and move forward with greater confidence."
        secondary={{ href: "/solutions/enrollment-readiness", label: "Explore Enrollment Readiness" }}
      />
    </>
  );
}
