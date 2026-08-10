import type { Metadata } from "next";
import { LiveStudentJourney } from "@/components/product/live-student-journey";
import { ArrowRight, Chart, Chat, Check, Compass, Doc, Wallet } from "@/components/icons";
import {
  Btn,
  CampusPhoto,
  Cols,
  CtaBand,
  PageHero,
  Section,
  SectionHead,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Student Experience — a guided enrollment journey",
  description:
    "Students shouldn't have to understand your org chart to enroll. Audentra turns separate requirements into one personalized path showing what is complete, what is still open, and what to do next.",
};

const cards = [
  {
    icon: Check,
    title: "Enrollment checklist",
    body: "Understand required actions across every office in a single list.",
  },
  {
    icon: Compass,
    title: "Next steps",
    body: "See what should happen now and what can wait.",
  },
  {
    icon: Doc,
    title: "Documents",
    body: "Upload requirements and track what has been received.",
  },
  {
    icon: Wallet,
    title: "Financial information",
    body: "Understand aid, remaining requirements, and available support.",
  },
  {
    icon: Chart,
    title: "Progress",
    body: "See enrollment completeness rather than guessing at it.",
  },
  {
    icon: Chat,
    title: "EDward",
    body: "Ask questions when something is unclear, and reach a person when it matters.",
  },
];

export default function StudentExperiencePage() {
  return (
    <>
      <PageHero
        eyebrow="Student Experience — Guide"
        title="Students shouldn't have to understand your org chart to enroll."
        lede={
          <>
            Students experience your university as one institution &mdash; even when their enrollment
            journey crosses Admissions, Financial Aid, Student Accounts, Housing, Orientation, and
            the Registrar.
            <br />
            <br />
            Audentra turns those separate requirements into one personalized path showing what is
            complete, what is still open, and what to do next.
          </>
        }
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              Explore Student Experience
            </Btn>
            <Btn href="/#platform" variant="outlineLight">
              See all capabilities
            </Btn>
          </>
        }
        aside={<LiveStudentJourney />}
      />

      <Section>
        <SectionHead
          eyebrow="What students see"
          title="Everything the institution needs, organized around the student."
          lede="Not six portals and a PDF. One place where requirements, progress, and support live together."
        />
        <Cols items={cards.slice(0, 3)} />
        <Cols items={cards.slice(3)} />
      </Section>

      <Section tone="paper">
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow">Why it matters</span>
            <h2 className="au-h2">
              Less &ldquo;Where do I go?&rdquo;
              <br />
              More &ldquo;I know what to do next.&rdquo;
            </h2>
            <p className="au-lede">
              Most enrollment melt is not a change of heart. It is an unresolved administrative step
              that nobody surfaced in time. Clarity for the student is risk reduction for the
              institution.
            </p>
            <div className="au-btn-row">
              <Btn href="/solutions/enrollment-readiness" variant="dark" icon={<ArrowRight />}>
                See the enrollment readiness case
              </Btn>
            </div>
          </div>

          <CampusPhoto
            alt="A university campus building on a clear morning"
            title="What changes for a student"
            items={[
              "One checklist instead of five office websites",
              "Deadlines with the context behind them",
              "Answers at 9pm, a person the next morning",
              "Visible progress toward being enrolled",
            ]}
          />
        </div>
      </Section>

      <CtaBand
        title="Show us where your students get stuck."
        lede="We'll walk through the same journey inside Audentra and show what a student would see instead."
        secondary={{ href: "/#platform", label: "See all capabilities" }}
      />
    </>
  );
}
