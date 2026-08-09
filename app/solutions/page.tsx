import type { Metadata } from "next";
import { ActionCenter } from "@/components/product/mocks";
import {
  ArrowRight,
  Building,
  Cap,
  Chart,
  Compass,
  Doc,
  Heart,
  Route,
  Target,
  Users,
  Wallet,
} from "@/components/icons";
import {
  ArrowLink,
  Btn,
  CheckList,
  CtaBand,
  PageHero,
  Section,
  SectionHead,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Intelligence for the work behind the student journey. Audentra begins with enrollment and is designed to help institutions create a more connected operating model across teams.",
};

const solutions = [
  {
    id: "enrollment-management",
    icon: Chart,
    title: "Enrollment Management",
    lede: "Know what is happening across the enrollment journey and where intervention is needed.",
    points: [
      { title: "Complete visibility across the funnel", body: "See which deposited students are not enrollment-ready and why." },
      { title: "Barriers, not just numbers", body: "Identify the administrative friction behind each at-risk cohort." },
      { title: "Coordinated response", body: "Direct staff action before friction turns into summer melt." },
    ],
  },
  {
    id: "admissions",
    icon: Users,
    title: "Admissions",
    lede: "Give counselors better context and clearer priorities.",
    points: [
      { title: "One ranked queue", body: "Replace report-pulling with a prioritized list of students who need attention." },
      { title: "Student context attached", body: "Requirements, documents, and history without switching systems." },
      { title: "Assisted outreach", body: "Drafted messages grounded in the student's actual status." },
    ],
  },
  {
    id: "financial-aid",
    icon: Wallet,
    title: "Financial Aid",
    lede: "Improve visibility around unresolved requirements and cross-office handoffs.",
    points: [
      { title: "Verification backlog in view", body: "Know which packages are paused and what is blocking each one." },
      { title: "Handoffs that close", body: "Track work that moves between Aid, Admissions, and Student Accounts." },
      { title: "Deadline-aware prioritization", body: "Surface the students whose aid gap threatens enrollment." },
    ],
  },
  {
    id: "enrollment-operations",
    icon: Route,
    title: "Enrollment Operations",
    lede: "Coordinate work that crosses systems, teams, and processes.",
    points: [
      { title: "Shared operating picture", body: "One queue across offices instead of five disconnected ones." },
      { title: "Service levels you can manage", body: "Know how long work waits and where it stalls." },
      { title: "Escalation paths", body: "Items past target surface to a leader automatically." },
    ],
  },
  {
    id: "institutional-leadership",
    icon: Building,
    title: "Institutional Leadership",
    lede: "Connect operational activity to strategic outcomes.",
    points: [
      { title: "Funnel movement in context", body: "Deposits, readiness, and projected melt against last cycle." },
      { title: "Capacity and bottlenecks", body: "Where the institution is under-resourced against demand." },
      { title: "Drill-down to the student", body: "Every metric resolves to the people behind it." },
    ],
  },
  {
    id: "students",
    icon: Cap,
    title: "Students",
    lede: "Give students clearer requirements, guidance, and support.",
    points: [
      { title: "Frictionless onboarding", body: "Preventable holds and missing documentation identified proactively." },
      { title: "One place to look", body: "Requirements, progress, financial information, and answers together." },
      { title: "Support that finds them", body: "Outreach before a deadline passes, not after." },
    ],
  },
];

/* Expansion sequence per the brand guide: enrollment first, then outward. */
const expansion = [
  { icon: Target, title: "Enrollment" },
  { icon: Wallet, title: "Financial Aid" },
  { icon: Compass, title: "Advising" },
  { icon: Doc, title: "Registrar" },
  { icon: Heart, title: "Student Affairs" },
  { icon: Chart, title: "Institutional Research" },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Intelligence for the work behind the student journey."
        lede="Audentra begins with enrollment and is designed to help institutions create a more connected operating model across teams."
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              Request a Demo
            </Btn>
            <Btn href="/solutions/enrollment-readiness" variant="outlineLight">
              Start with Enrollment Readiness
            </Btn>
          </>
        }
        aside={<ActionCenter title="Cross-office queue" />}
      />

      <Section>
        <SectionHead
          eyebrow="Where Audentra fits"
          title="The systems exist. The coordination does not."
          lede="Admissions, Financial Aid, Student Accounts, and the Registrar often work from different systems and queues. Staff reconcile status through reports, spreadsheets, and email."
        />
      </Section>

      {solutions.map((solution, index) => (
        <Section key={solution.id} tone={index % 2 === 0 ? "paper" : "white"} id={solution.id} tight>
          <div className={index % 2 === 0 ? "au-featurerow" : "au-featurerow au-featurerow--flip"}>
            <div>
              <span className="au-icon">
                <solution.icon />
              </span>
              <h2 className="au-h2">{solution.title}</h2>
              <p className="au-lede">{solution.lede}</p>
              <div style={{ marginTop: "1.5rem" }}>
                <ArrowLink href="/demo">Talk through this workflow</ArrowLink>
              </div>
            </div>
            <div>
              <CheckList items={solution.points} />
            </div>
          </div>
        </Section>
      ))}

      <Section tone="navy" mesh tight>
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow au-eyebrow--light">Expansion</span>
            <h2 className="au-h2">Prove value in enrollment. Then expand.</h2>
            <p className="au-lede">
              The same operating model applies wherever institutional work crosses departmental
              boundaries. Most institutions start with one cohort and one workflow.
            </p>
          </div>
          <ol className="au-path">
            {expansion.map((area, index) => (
              <li key={area.title}>
                <area.icon size={19} />
                <b>{area.title}</b>
                <span className="au-path__stage">
                  {index === 0 ? "Start here" : `Stage ${index + 1}`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <CtaBand
        title="Start where the pressure is highest."
        lede="Most institutions begin with enrollment readiness because the deadline is fixed and the result is measurable."
        secondary={{ href: "/solutions/enrollment-readiness", label: "Explore Enrollment Readiness" }}
      />
    </>
  );
}
