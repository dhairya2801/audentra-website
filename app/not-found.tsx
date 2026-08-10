import { ArrowRight } from "@/components/icons";
import { Btn, PageHero, Section, FeatureCard } from "@/components/ui";
import { Cap, Chart, Chat, Clipboard } from "@/components/icons";

export default function NotFound() {
  return (
    <>
      <PageHero
        eyebrow="404"
        title="That page isn't here."
        lede="The link may be out of date, or the page may have moved. Here's where most people are headed."
        actions={
          <Btn href="/" icon={<ArrowRight />}>
            Back to home
          </Btn>
        }
      />
      <Section>
        <div className="au-grid au-grid--4" style={{ marginTop: 0 }}>
          <FeatureCard
            icon={Chart}
            title="Platform"
            body="The intelligence layer for higher education."
            href="/#platform"
            cta="Explore"
          />
          <FeatureCard
            icon={Chat}
            title="EDward"
            body="Ask what is happening with a student, and why."
            href="/platform/edward"
            cta="Explore"
          />
          <FeatureCard
            icon={Clipboard}
            title="Enrollment Readiness"
            body="Deposited doesn't mean enrolled."
            href="/solutions/enrollment-readiness"
            cta="Explore"
          />
          <FeatureCard
            icon={Cap}
            title="Request a Pilot"
            body="Tell us what you're trying to improve."
            href="/demo"
            cta="Get started"
          />
        </div>
      </Section>
    </>
  );
}
