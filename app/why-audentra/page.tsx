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
    "Higher education doesn't need another disconnected system. It needs a more intelligent way to work.",
};

const differentiators = [
  {
    icon: Puzzle,
    title: "Augment, don't replace",
    body: "Keep the technology investments that already work. Audentra sits on top of your CRM and SIS rather than asking you to migrate off them.",
  },
  {
    icon: Chart,
    title: "Move beyond dashboards",
    body: "Understand what is happening — and what needs to happen next. Insight that has nowhere to go is just another report.",
  },
  {
    icon: Route,
    title: "Connect institutional work",
    body: "Bring people, information, and workflows together across departmental boundaries, where most enrollment work actually breaks.",
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
    body: "Modeled around requirements, holds, deadlines, and cross-office handoffs — not generic project tasks.",
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
            Higher education doesn&rsquo;t need another disconnected system.
            <br />
            It needs a more intelligent way to work.
          </>
        }
        lede={
          <>
            Connect the systems you already have. Coordinate the work they can&rsquo;t.
            <br />
            <br />
            Purpose-built for higher education, and designed around the coordination problem rather
            than the reporting problem.
          </>
        }
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              Request a Pilot
            </Btn>
            <Btn href="/#platform" variant="outlineLight">
              Explore the Platform
            </Btn>
          </>
        }
      />

      <Section>
        <SectionHead
          eyebrow="The reality"
          title="The systems exist. The coordination does not."
          lede="Admissions, Financial Aid, Student Accounts, and the Registrar often work from different systems and queues. Staff reconcile status through reports, spreadsheets, and email — and students absorb the gap."
        />
        <Cols items={differentiators} />
      </Section>

      <Section tone="paper">
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow">The distinction</span>
            <h2 className="au-h2">Audentra is not another AI tool for colleges.</h2>
            <p className="au-lede">
              AI is part of how Audentra works. It isn&rsquo;t the Audentra story. Audentra is an
              institutional intelligence layer designed to help colleges and universities understand
              what matters now, coordinate what happens next, and measure whether the intervention
              changed the outcome.
            </p>
            <CheckList
              items={[
                {
                  title: "The problem is coordination, not computation",
                  body: "Institutions rarely lack data. They lack a shared operating picture and a place for action to live.",
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
          title="Purpose-built where general-purpose tools stop."
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
        title="Bring your hardest coordination problem."
        lede="We'd rather talk about the workflow that keeps failing than run a generic product tour."
        primary={{ href: "/demo", label: "Request a Pilot" }}
        secondary={{ href: "/trust", label: "How we handle trust" }}
      />
    </>
  );
}
