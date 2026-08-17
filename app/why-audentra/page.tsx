import type { Metadata } from "next";
import { ActionCenter } from "@/components/product/mocks";
import { ArrowRight, Chart, Layers, Puzzle, Route, Shield, Target, Users } from "@/components/icons";
import {
  Btn,
  CheckList,
  Cols,
  CtaBand,
  PageHero,
  Section,
  SectionHead,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Why Audentra",
  description:
    "Connect the systems higher education already has and coordinate the work between them with institutional intelligence.",
};

const differentiators = [
  {
    icon: Puzzle,
    title: "Build on existing investments",
    body: "Keep the technology investments that already work. Audentra sits on top of your CRM and SIS rather than asking you to migrate off them.",
  },
  {
    icon: Chart,
    title: "Move from insight to action",
    body: "Understand what is happening, choose the next step, and coordinate the people who can move it forward.",
  },
  {
    icon: Route,
    title: "Connect institutional work",
    body: "Bring people, information, and workflows together across departmental boundaries around one shared student journey.",
  },
  {
    icon: Shield,
    title: "Keep people in control",
    body: "Use AI to increase institutional capacity while maintaining human oversight, permissions, and accountability.",
  },
];

const builtFor = [
  {
    icon: Layers,
    title: "Institutional workflows",
    body: "Modeled around requirements, milestones, dates, and cross-office handoffs in higher education.",
  },
  {
    icon: Users,
    title: "Higher-ed roles",
    body: "Staff, leaders, executives, and students each get a view built for the decision they are making.",
  },
  {
    icon: Target,
    title: "Measurable outcomes",
    body: "Scoped to a cohort and a baseline so the institution can tell whether it worked.",
  },
];

export default function WhyAudentraPage() {
  return (
    <>
      <PageHero
        eyebrow="Why Audentra"
        title={
          <>
            Connect the systems you already have.
            <br />
            Coordinate the work between them.
          </>
        }
        lede={
          <>
            Connect the systems you already have. Coordinate the work they can&rsquo;t.
            <br />
            <br />
            Institutional intelligence purpose-built for higher education and the people guiding each
            student journey.
          </>
        }
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              See Audentra in Action
            </Btn>
            <Btn href="/#platform" variant="outlineLight">
              Explore the Platform
            </Btn>
          </>
        }
      />

      <Section>
        <SectionHead
          eyebrow="The opportunity"
          title="The systems exist. Audentra connects their intelligence and work."
          lede="Admissions, Financial Aid, Student Accounts, and the Registrar each contribute essential information and expertise. Audentra brings their signals and next actions into one institutional picture."
        />
        <Cols items={differentiators} />
      </Section>

      <Section tone="paper">
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow">The distinction</span>
            <h2 className="au-h2">Institutional intelligence, with AI in service of the work.</h2>
            <p className="au-lede">
              AI is part of how Audentra works. It isn&rsquo;t the Audentra story. Audentra is an
              institutional intelligence layer designed to help colleges and universities understand
              what matters now, coordinate what happens next, and measure whether the intervention
              changed the outcome.
            </p>
            <CheckList
              items={[
                {
                  title: "Coordination creates the value",
                  body: "Institutional data becomes more useful in a shared operating picture with a clear place for action to live.",
                },
                {
                  title: "Your existing systems remain the systems of record",
                  body: "Your CRM and SIS stay where they are. Audentra connects the intelligence and work between them.",
                },
                {
                  title: "Your people remain accountable for consequential decisions",
                  body: "Important actions stay governed by institutional permissions and approval.",
                },
              ]}
            />
          </div>
          <ActionCenter title="Coordinated cross-office work" />
        </div>
      </Section>

      <Section tone="navy" mesh>
        <SectionHead
          eyebrow="Built for the institution"
          title="Purpose-built for the institution."
          light
        />
        <Cols items={builtFor} />
      </Section>

      <Section tight>
        <div className="au-section-head">
          <h2 className="au-h1">
            The goal isn&rsquo;t autonomous higher education.
            <br />
            <span className="au-gradient-text--dark">It&rsquo;s better-equipped people.</span>
          </h2>
        </div>
      </Section>

      <CtaBand
        title="Bring an enrollment workflow you want to strengthen."
        lede="We'll connect the people, signals, actions, and measures that shape it."
        primary={{ href: "/demo", label: "See Audentra in Action" }}
        secondary={{ href: "/trust", label: "How we handle trust" }}
      />
    </>
  );
}
