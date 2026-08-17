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
    "Give every student one personalized enrollment path showing completed milestones, upcoming steps, and available support across the institution.",
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
        title="Give every student one clear path to enrollment."
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
          lede="One place where requirements, progress, guidance, and support live together across every participating office."
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
              Clear milestones help students move forward with confidence. That same clarity gives
              institutional teams a shared view of where timely support can strengthen progress.
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
        title="Show us a student journey you want to strengthen."
        lede="We'll walk through that journey inside Audentra and show the coordinated view for students and teams."
        secondary={{ href: "/#platform", label: "See all capabilities" }}
      />
    </>
  );
}
