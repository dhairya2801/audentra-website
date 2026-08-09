import type { Metadata } from "next";
import { ArrowRight } from "@/components/icons";
import { Btn, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Audentra approaches privacy, and how to reach us with questions.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy"
        lede="How Audentra approaches the information institutions and individuals entrust to us."
      />

      <Section>
        <div className="au-container--narrow">
          <div
            className="au-card"
            style={{ padding: "1.25rem 1.5rem", background: "var(--au-paper)", marginBottom: "2.5rem" }}
          >
            <strong style={{ fontSize: "0.9375rem" }}>Placeholder page.</strong>
            <p className="au-body" style={{ marginTop: "0.35rem" }}>
              Audentra&rsquo;s full privacy policy is being finalized with counsel. This page states
              our approach; it is not the binding policy and should be replaced before launch.
            </p>
          </div>

          <h2 className="au-h3">Our approach</h2>
          <p className="au-body">
            Audentra processes institutional information on behalf of the colleges and universities we
            work with. Institutions remain the controllers of their data; Audentra acts as a processor
            under the terms of the agreement with each institution.
          </p>

          <h2 className="au-h3" style={{ marginTop: "2rem" }}>
            Institutional data
          </h2>
          <p className="au-body">
            Each institution&rsquo;s information remains logically separated. Access within the
            platform is role-based, and relevant actions can be tracked and reviewed. Audentra does not
            sell institutional or student information.
          </p>

          <h2 className="au-h3" style={{ marginTop: "2rem" }}>
            Website information
          </h2>
          <p className="au-body">
            Information submitted through forms on this website is used to respond to your inquiry and
            to communicate about Audentra. You can ask us to remove it at any time.
          </p>

          <h2 className="au-h3" style={{ marginTop: "2rem" }}>
            Questions
          </h2>
          <p className="au-body">
            For data protection agreements, subprocessor lists, or a specific privacy questionnaire,
            contact us and we will respond in writing.
          </p>

          <div className="au-btn-row">
            <Btn href="/demo" variant="dark" icon={<ArrowRight />}>
              Contact us
            </Btn>
          </div>
        </div>
      </Section>
    </>
  );
}
