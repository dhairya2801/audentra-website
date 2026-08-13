import type { Metadata } from "next";
import { ActionCenter } from "@/components/product/mocks";
import {
  ArrowRight,
  Building,
  Cap,
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
    id: "student-experience",
    icon: Cap,
    title: "Student Experience",
    lede: "Students shouldn't have to understand your org chart to enroll.",
    points: [
      { title: "Frictionless onboarding", body: "Preventable holds and missing documentation identified proactively." },
      { title: "One place to look", body: "Requirements, progress, financial information, and answers together." },
      { title: "Support that finds them", body: "Outreach before a deadline passes, not after." },
    ],
  },
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
              Request a Pilot
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

      <CtaBand
        title="Start where the pressure is highest."
        lede="Most institutions begin with enrollment readiness because the deadline is fixed and the result is measurable."
        secondary={{ href: "/solutions/enrollment-readiness", label: "Explore Enrollment Readiness" }}
      />
    </>
  );
}
