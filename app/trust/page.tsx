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
    body: "AI responses are designed to stay grounded in approved institutional information and clearly defined sources.",
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

const cioQuestions = [
  {
    icon: Layers,
    title: "What data does Audentra access?",
    body: "The approved sources, data categories, student information, and minimum-necessary access are documented with each institution before configuration.",
  },
  {
    icon: Lock,
    title: "Where does institutional data go?",
    body: "Hosting, storage, encryption, retention, and deletion paths are reviewed in writing as part of implementation and procurement.",
  },
  {
    icon: Shield,
    title: "What information can AI use?",
    body: "Model providers, approved data paths, source grounding, and model boundaries are made explicit for institutional review.",
  },
  {
    icon: Handshake,
    title: "What can AI do?",
    body: "Institutions define permitted actions and human approval gates, with people accountable for consequential decisions and communications.",
  },
  {
    icon: Users,
    title: "Who can access what?",
    body: "Authentication, SSO requirements, role mapping, administrative controls, and permissions are aligned with institutional responsibilities.",
  },
  {
    icon: Eye,
    title: "Can we reconstruct what happened?",
    body: "Activity history, recommendations, approvals, and completed actions are designed to provide a clear, reviewable record.",
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
            while preserving institutional accountability.
          </>
        }
        actions={
          <Btn href="#cio-questions" icon={<ArrowRight />}>
            Explore Our Trust Approach
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

      <Section id="cio-questions" tone="paper">
        <SectionHead
          eyebrow="The CIO view"
          title="Six questions every institution should be able to answer."
          lede="Audentra makes the data path, AI boundaries, permissions, approval model, and activity history part of the implementation conversation from the beginning."
        />
        <Cols items={cioQuestions.slice(0, 3)} />
        <Cols items={cioQuestions.slice(3)} />
      </Section>

      <Section>
        <div className="au-container--narrow">
          <span className="au-eyebrow">A note on certifications</span>
          <h2 className="au-h2">We publish each achievement with precision.</h2>
          <p className="au-lede" style={{ maxWidth: "none" }}>
            Audentra publishes certifications when they are achieved. Security and privacy
            commitments, current certification status, data handling practices, and subprocessor
            details are reviewed directly with each institution during procurement and security review.
          </p>
          <p className="au-body">
            If your institution has a specific security questionnaire, data protection addendum, or
            accessibility conformance requirement, we will answer it precisely and in writing.
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
              Audentra uses AI to help staff move more of the right work forward. Institutional
              permissions and people remain attached to every consequential decision and action.
            </p>
          </div>
          <Cols
            items={[
              {
                icon: Shield,
                title: "Human review is built in",
                body: "Communication drafted by EDward is reviewed by staff before it reaches a student.",
              },
              {
                icon: Eye,
                title: "Explainable by design",
                body: "Prioritization shows the signals behind it, so staff can evaluate and confirm it.",
              },
            ]}
          />
        </div>
      </Section>

      <CtaBand
        title="Bring your security and governance team into the first conversation."
        lede="We will review the data path, AI boundaries, permissions, and documentation together from the start."
        secondary={{ href: "/accessibility", label: "Accessibility commitment" }}
      />
    </>
  );
}
