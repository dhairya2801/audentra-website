import type { Metadata } from "next";
import { ArrowRight, Compass, Handshake, Heart, Shield, Target } from "@/components/icons";
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
  title: "About",
  description:
    "We're building the intelligence layer that helps higher education turn existing information into clearer decisions and coordinated execution.",
};

const values = [
  {
    icon: Heart,
    title: "Student dignity",
    body: "Build technology that supports students as people and honors their individual context.",
  },
  {
    icon: Shield,
    title: "Trust & explainability",
    body: "Institutional intelligence should be understandable and accountable.",
  },
  {
    icon: Target,
    title: "Speed to evidence",
    body: "Strengthen meaningful operations and measure what changes.",
  },
  {
    icon: Handshake,
    title: "Institutional partnership",
    body: "Build alongside institutions and their teams.",
  },
  {
    icon: Compass,
    title: "Founder discipline",
    body: "Stay focused on meaningful priorities and measurable value.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Audentra"
        title="We're building the intelligence layer for more connected higher education."
        lede="Higher education brings together powerful technology, rich information, and talented people. Audentra helps them work as one around the student journey."
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              See Audentra in Action
            </Btn>
            <Btn href="/why-audentra" variant="outlineLight">
              See How Audentra Works
            </Btn>
          </>
        }
        aside={
          <CampusPhoto
            priority
            alt="A university campus building on a clear morning"
            title="Where we started"
            items={[
              "Founded by higher-ed operators",
              "Built around enrollment first",
              "Designed alongside pilot institutions",
            ]}
          />
        }
      />

      <Section>
        <div className="au-container--narrow">
          <p className="au-lede" style={{ maxWidth: "none", fontSize: "1.25rem", color: "var(--au-ink)" }}>
            Audentra was created to help institutions turn existing information into clearer decisions,
            more coordinated workflows, and better execution. We started with enrollment because the
            timeline is clear, the measures are concrete, and coordinated support can make a visible
            difference for students and teams.
          </p>
        </div>
      </Section>

      <Section tone="paper">
        <div className="au-grid au-grid--2" style={{ marginTop: 0 }}>
          <div>
            <span className="au-eyebrow">Mission</span>
            <h2 className="au-h3">Improve the work behind every enrollment outcome.</h2>
            <p className="au-body">
              Audentra helps higher-education institutions understand and support every student at the
              right moment &mdash; turning institutional data into timely action that improves
              enrollment, engagement, and student success.
            </p>
          </div>
          <div>
            <span className="au-eyebrow">Vision</span>
            <h2 className="au-h3">
              Make every decision affecting a student timely, personalized, and data-informed.
            </h2>
            <p className="au-body">
              A future where colleges and universities operate as one connected institution around
              every student.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Our values" title="What we hold to." />
        <Cols items={values} />
      </Section>

      <CtaBand
        title="Let's build the next operating model together."
        lede="We're partnering with institutions that value evidence, shared learning, and measurable progress."
        secondary={{ href: "/why-audentra", label: "Why Audentra" }}
      />
    </>
  );
}
