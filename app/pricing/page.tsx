import type { Metadata } from "next";
import { ArrowRight, Chart, Target } from "@/components/icons";
import {
  ArrowLink,
  Btn,
  CheckList,
  Cols,
  CtaBand,
  PageHero,
  Section,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Audentra pricing is based on institutional scope, participating workflows, implementation requirements, and platform capabilities.",
};

const pilotIncludes = [
  { title: "Defined cohort", body: "One population, agreed before configuration begins." },
  { title: "Selected workflows", body: "The requirements driving the most measurable friction." },
  { title: "Participating departments", body: "The offices that must coordinate to clear them." },
  { title: "Implementation and configuration", body: "Audentra configured around your actual process." },
  { title: "Success measures", body: "Criteria agreed in advance, not defined after the fact." },
  { title: "Executive review", body: "A readout with your sponsor at the end of the cycle." },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Start with a problem worth solving."
        lede="Audentra pricing is based on institutional scope, participating workflows, implementation requirements, and platform capabilities."
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              Request Pricing
            </Btn>
            <Btn href="/pilot" variant="outlineLight">
              See the Pilot Program
            </Btn>
          </>
        }
      />

      <Section>
        <div className="au-container--narrow" style={{ textAlign: "center" }}>
          <span className="au-eyebrow">How we price</span>
          <h2 className="au-h2">Scoped first, then priced.</h2>
          <p className="au-lede" style={{ marginInline: "auto" }}>
            Scope depends on the size of the population you want to cover, how many workflows and
            departments participate, and what has to be configured to fit your existing environment.
            We would rather quote the real thing than publish a number that changes in the first
            meeting.
          </p>
        </div>
      </Section>

      {/* Main offer */}
      <Section tone="paper">
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow">The main offer</span>
            <h2 className="au-h2">Enrollment Readiness Pilot</h2>
            <p className="au-lede">
              A focused starting point designed around a defined population, operational workflow, and
              measurable institutional objective &mdash; scoped to run inside one enrollment cycle.
            </p>
            <div className="au-btn-row">
              <Btn href="/demo" variant="dark" icon={<ArrowRight />}>
                Discuss a Pilot
              </Btn>
              <Btn href="/solutions/enrollment-readiness" variant="outline">
                See the use case
              </Btn>
            </div>
          </div>

          <div className="au-card" style={{ padding: "2rem" }}>
            <span className="au-pill">What a pilot includes</span>
            <CheckList items={pilotIncludes} />
          </div>
        </div>
      </Section>

      <Section tone="navy" mesh tight>
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow au-eyebrow--light">What to expect from the conversation</span>
            <h2 className="au-h2">A scope, a timeline, and a number you can take to a budget owner.</h2>
            <p className="au-lede">
              We will ask about your melt window, the offices involved, the systems in play, and how
              your institution measures success. You will leave with a written scope rather than a
              proposal to be continued.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <ArrowLink href="/demo" light>
                Start the pricing conversation
              </ArrowLink>
            </div>
          </div>
          <Cols
            items={[
              {
                icon: Target,
                title: "Scope first",
                body: "Population, workflows, and departments before any number is discussed.",
              },
              {
                icon: Chart,
                title: "Measures agreed up front",
                body: "What has to move for this to count as a success at your institution.",
              },
            ]}
          />
        </div>
      </Section>

      <CtaBand
        title="Tell us what you're trying to improve."
        lede="We'll come back with a scope and a price rather than a tier."
        secondary={{ href: "/pilot", label: "Become a Pilot Institution" }}
      />
    </>
  );
}
