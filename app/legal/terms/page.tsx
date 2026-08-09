import type { Metadata } from "next";
import { ArrowRight } from "@/components/icons";
import { Btn, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms governing use of the Audentra website.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms"
        lede="Terms governing use of this website. Platform use is governed by each institution's agreement with Audentra."
      />

      <Section>
        <div className="au-container--narrow">
          <div
            className="au-card"
            style={{ padding: "1.25rem 1.5rem", background: "var(--au-paper)", marginBottom: "2.5rem" }}
          >
            <strong style={{ fontSize: "0.9375rem" }}>Placeholder page.</strong>
            <p className="au-body" style={{ marginTop: "0.35rem" }}>
              Audentra&rsquo;s website terms of service are being finalized with counsel. This page
              summarizes intent; it is not the binding agreement and should be replaced before launch.
            </p>
          </div>

          <h2 className="au-h3">Website use</h2>
          <p className="au-body">
            This website is provided for informational purposes. Content describing the Audentra
            platform is descriptive rather than contractual, and product capabilities may change as the
            platform develops.
          </p>

          <h2 className="au-h3" style={{ marginTop: "2rem" }}>
            Platform agreements
          </h2>
          <p className="au-body">
            Use of the Audentra platform is governed by the written agreement between Audentra and the
            institution, including any data protection terms, service levels, and security commitments
            agreed during procurement.
          </p>

          <h2 className="au-h3" style={{ marginTop: "2rem" }}>
            Trademarks
          </h2>
          <p className="au-body">
            Institution names and marks referenced on this website belong to their respective owners
            and are used to describe relationships and context, not to imply endorsement.
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
