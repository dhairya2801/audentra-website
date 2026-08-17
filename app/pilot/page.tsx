import type { Metadata } from "next";
import { ArrowRight } from "@/components/icons";
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
  title: "Pilot Program",
  description:
    "Prove the impact in one enrollment cycle. Start with one cohort and one enrollment workflow where coordinated support can create measurable progress.",
};

const steps = [
  { title: "Define", body: "Choose the priority and the population. Agree on what success would look like." },
  { title: "Baseline", body: "Understand the current workflow and record where it stands today." },
  { title: "Configure", body: "Deploy Audentra around the selected use case and your existing systems." },
  { title: "Operate", body: "Put the workflow into practice with the teams who own it." },
  { title: "Measure", body: "Compare performance against the criteria agreed in step one." },
  { title: "Expand", body: "Determine what comes next based on evidence rather than enthusiasm." },
];

export default function PilotPage() {
  return (
    <>
      <PageHero
        eyebrow="Pilot Program"
        title="Prove the impact in one enrollment cycle."
        lede={
          <>
            Start with one cohort and one enrollment workflow where greater visibility and
            coordination can create measurable progress.
            <br />
            <br />
            Together, we&rsquo;ll establish the baseline, deploy Audentra around the workflow,
            measure what changes, and decide what comes next based on evidence.
            <br />
            <br />
            Focused scope. Measurable outcome. A practical path to broader value.
          </>
        }
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              Request an Enrollment Readiness Pilot
            </Btn>
            <Btn href="#how-a-pilot-runs" variant="outlineLight">
              See How the Pilot Works
            </Btn>
          </>
        }
        aside={
          <CampusPhoto
            priority
            src="/images/campus-quad.jpg"
            alt="A university campus building on a clear morning"
            title="Who this is for"
            items={[
              "Institutions with a measurable enrollment priority",
              "An executive sponsor who wants evidence",
              "Teams ready to strengthen a shared workflow",
            ]}
          />
        }
      />

      <Section id="how-a-pilot-runs">
        <SectionHead
          eyebrow="How a pilot runs"
          title="Six steps, one enrollment cycle."
          lede="Focused enough to run within current operations. Specific enough to prove or disprove the value."
        />
        <Cols items={steps.slice(0, 3)} numbered />
        <Cols items={steps.slice(3)} numbered />
      </Section>

      <Section tone="paper">
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow">What makes a pilot successful</span>
            <h2 className="au-h2">Four things that decide whether a pilot proves anything.</h2>
            <p className="au-lede">
              Pilots work when the institution treats them as an operating change. The pattern is
              consistent across the ones that produce evidence.
            </p>
            <CheckList
              items={[
                { title: "An executive sponsor", body: "Someone accountable for the outcome being measured." },
                { title: "A working team", body: "The staff who run the workflow every day." },
                { title: "A baseline", body: "Permission to record where things stand before we start." },
                { title: "Candid feedback", body: "Clear input throughout the operating cycle." },
              ]}
            />
          </div>

          <div className="au-card" style={{ padding: "2rem" }}>
            <span className="au-pill">What we commit to</span>
            <CheckList
              items={[
                { title: "Configuration around your process", body: "A workflow shaped to your institution." },
                { title: "A weekly operating review", body: "With the team actually doing the work." },
                { title: "Measurement you can audit", body: "Numbers your institutional research office can verify." },
                { title: "An honest readout", body: "Including every measure and what the evidence supports." },
              ]}
            />
          </div>
        </div>
      </Section>

      <CtaBand
        title="Prove or disprove the value in one cycle."
        lede="We're selecting a limited number of pilot institutions for the 2026–27 enrollment cycle."
        primary={{ href: "/demo", label: "Request an Enrollment Readiness Pilot" }}
        secondary={{ href: "/pricing", label: "How pricing works" }}
      />
    </>
  );
}
