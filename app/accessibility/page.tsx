import type { Metadata } from "next";
import { ArrowRight, Contrast, Focus, FormIcon, Keyboard, Speaker, TextSize } from "@/components/icons";
import { Btn, CtaBand, PageHero, Section, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Audentra is committed to creating inclusive digital experiences for students, staff, and institutional leaders. We target WCAG 2.2 AA.",
};

const commitments = [
  {
    icon: Keyboard,
    title: "Keyboard navigation",
    body: "Every interactive element is reachable and operable without a pointing device.",
  },
  {
    icon: Speaker,
    title: "Screen reader support",
    body: "Semantic structure, meaningful labels, and announced state changes.",
  },
  {
    icon: Contrast,
    title: "High contrast",
    body: "Text and interface colors are chosen to meet contrast requirements, not brand preference alone.",
  },
  {
    icon: TextSize,
    title: "Responsive text",
    body: "Layouts remain usable when text is enlarged up to 200%.",
  },
  {
    icon: Focus,
    title: "Visible focus states",
    body: "Focus is always visible, never suppressed for aesthetics.",
  },
  {
    icon: FormIcon,
    title: "Accessible forms",
    body: "Associated labels, clear error messaging, and no reliance on color alone.",
  },
];

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        eyebrow="Accessibility"
        title="Designed for everyone. Built for accessibility."
        lede="Audentra is committed to creating inclusive digital experiences for students, staff, and institutional leaders."
      />

      <Section>
        <SectionHead
          eyebrow="Our target"
          title="WCAG 2.2 Level AA across this website and the product."
          lede="Higher education serves everyone, which means the software behind it has to work for everyone. Accessibility is treated as a requirement during design and review rather than a remediation project afterwards."
        />

        <div className="au-a11y au-a11y--detail">
          <div className="au-a11y__items">
            {commitments.map((item) => (
              <div className="au-a11y__item" key={item.title}>
                <item.icon size={26} />
                <span>{item.title}</span>
                <small>{item.body}</small>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="au-container--narrow">
          <h2 className="au-h2">Conformance status</h2>
          <p className="au-lede" style={{ maxWidth: "none" }}>
            WCAG 2.2 AA is the standard we design and build against. We do not publish a conformance
            claim we have not independently validated. Where your institution requires a formal
            accessibility conformance report (ACR/VPAT) as part of procurement, we will share our
            current status and remediation plan in writing.
          </p>

          <h2 className="au-h2" style={{ marginTop: "2.5rem" }}>
            Reporting a barrier
          </h2>
          <p className="au-lede" style={{ maxWidth: "none" }}>
            If you encounter a barrier on this website or in the product, we want to know. Tell us what
            you were trying to do, the page or screen, and the assistive technology you were using, and
            we will respond with a fix or a timeline.
          </p>
          <div className="au-btn-row">
            <Btn href="/demo" variant="dark" icon={<ArrowRight />}>
              Report an accessibility issue
            </Btn>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Accessibility questions belong in the first conversation."
        lede="Bring your requirements early and we'll answer them in writing."
        secondary={{ href: "/trust", label: "Trust & security" }}
      />
    </>
  );
}
