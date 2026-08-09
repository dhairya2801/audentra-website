import type { Metadata } from "next";
import { Tabs } from "@/components/tabs";
import { ArrowRight } from "@/components/icons";
import { Btn, CtaBand, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Insights for the people building what's next in higher education — enrollment operations, institutional intelligence, and student experience.",
};

type Resource = {
  kind: "REPORT" | "GUIDE" | "ARTICLE" | "WEBINAR";
  title: string;
  blurb: string;
  categories: string[];
};

const resources: Resource[] = [
  {
    kind: "REPORT",
    title: "The State of Enrollment Operations",
    blurb: "Where enrollment work actually breaks down between admission and the first day of class.",
    categories: ["enrollment", "operations"],
  },
  {
    kind: "GUIDE",
    title: "The Enrollment Readiness Playbook",
    blurb: "A practical operating loop for the melt window: identify, prioritize, coordinate, measure.",
    categories: ["enrollment", "operations"],
  },
  {
    kind: "ARTICLE",
    title: "Why AI in Higher Education Needs an Action Layer",
    blurb: "Insight without a place for action to live is another report nobody opens.",
    categories: ["ai", "research"],
  },
  {
    kind: "WEBINAR",
    title: "Reducing Enrollment Melt Through Better Coordination",
    blurb: "How cross-office handoffs — not student intent — drive most summer melt.",
    categories: ["enrollment", "operations"],
  },
  {
    kind: "ARTICLE",
    title: "Why Your CRM Isn't the Problem",
    blurb: "The systems are fine. The work between them is where institutions lose students.",
    categories: ["operations", "ai"],
  },
  {
    kind: "GUIDE",
    title: "Building an Institutional AI Strategy",
    blurb: "Governance, grounding, and oversight questions to answer before you deploy anything.",
    categories: ["ai", "research"],
  },
  {
    kind: "ARTICLE",
    title: "What Students Actually See During Enrollment",
    blurb: "Six offices, four portals, one deadline — mapped from the student's side of the desk.",
    categories: ["student", "enrollment"],
  },
  {
    kind: "REPORT",
    title: "Audentra Product Updates",
    blurb: "What shipped, what changed, and what pilot institutions asked us to build next.",
    categories: ["updates"],
  },
];

const categories = [
  { id: "all", label: "All" },
  { id: "enrollment", label: "Enrollment" },
  { id: "ai", label: "AI & Institutional Intelligence" },
  { id: "operations", label: "Operations" },
  { id: "student", label: "Student Experience" },
  { id: "research", label: "Research" },
  { id: "updates", label: "Audentra Updates" },
];

function ResourceThumb() {
  return (
    <div className="au-resource__thumb">
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 78C64 40 128 96 200 68c72-28 128-8 200 22v30H0Z"
          fill="none"
          stroke="rgb(255 255 255 / 34%)"
          strokeWidth="1.2"
        />
        <path
          d="M0 96C72 58 132 108 204 84c72-24 124-4 196 26v10H0Z"
          fill="none"
          stroke="rgb(126 216 255 / 42%)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

function ResourceGrid({ items }: { items: Resource[] }) {
  return (
    <div className="au-grid au-grid--4" style={{ marginTop: "2.5rem" }}>
      {items.map((item) => (
        <article className="au-card au-resource" key={item.title}>
          <ResourceThumb />
          <div className="au-resource__body">
            <span className="au-tag">{item.kind}</span>
            <h3 className="au-h4" style={{ marginTop: "0.5rem" }}>
              {item.title}
            </h3>
            <p className="au-body">{item.blurb}</p>
            <div className="au-card__foot">
              <span className="au-pill">Coming soon</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Insights for the people building what's next in higher education."
        lede="Research, playbooks, and practical guidance on enrollment operations, institutional intelligence, and the work behind every student outcome."
        actions={
          <Btn href="/demo" icon={<ArrowRight />}>
            Talk with our team
          </Btn>
        }
      />

      <Section>
        <div className="au-section-head">
          <p className="au-body">
            Audentra is a young company and we would rather publish nothing than publish filler. The
            library below is in production &mdash; tell us which one you want first and we will send it
            when it is ready.
          </p>
        </div>

        <Tabs
          label="Resource categories"
          tabs={categories.map((category) => ({
            id: category.id,
            label: category.label,
            content: (
              <ResourceGrid
                items={
                  category.id === "all"
                    ? resources
                    : resources.filter((resource) => resource.categories.includes(category.id))
                }
              />
            ),
          }))}
        />
      </Section>

      <CtaBand
        title="Want one of these before it's published?"
        lede="Tell us which topic matters to your team and we'll share the draft."
        primary={{ href: "/demo", label: "Request a resource" }}
        secondary={{ href: "/solutions/enrollment-readiness", label: "Explore Enrollment Readiness" }}
      />
    </>
  );
}
