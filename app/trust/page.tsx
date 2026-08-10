import type { Metadata } from "next";
import { ArrowRight, Doc, Eye, Handshake, Layers, Lock, Shield, Users } from "@/components/icons";
import { Btn, Cols, CtaBand, PageHero, Section, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Trust",
  description:
    "Institutional intelligence requires institutional trust. Audentra is designed around responsible access, institutional governance, human oversight, and traceability.",
};

const pillars = [
  {
    icon: Layers,
    title: "Institutional knowledge",
    body: "AI responses are designed to be grounded in approved institutional information rather than open-ended generation.",
  },
  {
    icon: Handshake,
    title: "Human oversight",
    body: "Important actions remain governed by institutional permissions and approval. Drafted communication waits for a person.",
  },
  {
    icon: Users,
    title: "Role-based access",
    body: "Students, staff, leaders, and executives receive access appropriate to their roles.",
  },
  {
    icon: Eye,
    title: "Auditability",
    body: "Relevant actions can be tracked and reviewed, so the institution can answer what happened and why.",
  },
  {
    icon: Lock,
    title: "Institutional data isolation",
    body: "Each institution's information remains logically separated.",
  },
  {
    icon: Doc,
    title: "Source visibility",
    body: "Where an answer came from is part of the answer, so staff can verify before acting.",
  },
];

export default function TrustPage() {
  return (
    <>
      <PageHero
        eyebrow="Trust, security, and responsible AI"
        title="Institutional intelligence requires institutional trust."
        lede={
          <>
            Audentra is designed for environments where student information, institutional policy,
            AI-assisted recommendations, and consequential decisions require clear boundaries.
            <br />
            <br />
            Our approach is built around a simple principle: AI can increase institutional capacity
            without reducing institutional accountability.
          </>
        }
        actions={
          <Btn href="/demo" icon={<ArrowRight />}>
            Request a Pilot
          </Btn>
        }
      />

      <Section>
        <SectionHead
          eyebrow="How we approach it"
          title="Six commitments behind every feature."
          lede="These are design principles the product is built around, reviewed with each institution during implementation."
        />
        <Cols items={pillars.slice(0, 3)} />
        <Cols items={pillars.slice(3)} />
      </Section>

      <Section tone="paper">
        <div className="au-container--narrow">
          <span className="au-eyebrow">A note on certifications</span>
          <h2 className="au-h2">We publish what we have achieved, and nothing else.</h2>
          <p className="au-lede" style={{ maxWidth: "none" }}>
            Audentra does not display compliance badges the company has not earned. Security and
            privacy commitments, current certification status, data handling practices, and
            subprocessor details are reviewed directly with each institution during procurement and
            security review.
          </p>
          <p className="au-body">
            If your institution has a specific security questionnaire, data protection addendum, or
            accessibility conformance requirement, we would rather answer it in writing than gesture at
            a logo.
          </p>
          <div className="au-btn-row">
            <Btn href="/demo" variant="dark" icon={<ArrowRight />}>
              Request our security documentation
            </Btn>
          </div>
        </div>
      </Section>

      <Section tone="navy" mesh tight>
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow au-eyebrow--light">Responsible AI</span>
            <h2 className="au-h2">AI increases capacity. People keep accountability.</h2>
            <p className="au-lede">
              Audentra uses AI to help staff work through more of the right things, not to make
              institutional decisions on their behalf. Every consequential action has a person attached
              to it.
            </p>
          </div>
          <Cols
            items={[
              {
                icon: Shield,
                title: "Nothing leaves without review",
                body: "Communication drafted by EDward is reviewed by staff before it reaches a student.",
              },
              {
                icon: Eye,
                title: "Explainable by design",
                body: "Prioritization shows the signals behind it, so staff can disagree with it.",
              },
            ]}
          />
        </div>
      </Section>

      <CtaBand
        title="Bring your security review to the first conversation."
        lede="We would rather answer the hard questions early than discover them at contracting."
        secondary={{ href: "/accessibility", label: "Accessibility commitment" }}
      />
    </>
  );
}
