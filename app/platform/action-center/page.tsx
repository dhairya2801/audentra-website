import type { Metadata } from "next";
import { LiveActionCenter } from "@/components/product/live-action-center";
import { AppFrame, Panel, Row } from "@/components/product/mocks";
import {
  ArrowRight,
  Bolt,
  Check,
  Clock,
  Doc,
  Layers,
  Mail,
  Pulse,
  Route,
  Users,
  Wallet,
} from "@/components/icons";
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
  title: "Action Center — operational work management",
  description:
    "The Audentra Action Center converts student needs, institutional priorities, messages, and operational signals into clear, trackable work.",
};

const fields = [
  { label: "Task", value: "What needs to happen, in institutional language." },
  { label: "Owner", value: "A named person, not a shared inbox." },
  { label: "Student", value: "The record and context the work belongs to." },
  { label: "Priority", value: "Derived from risk, deadlines, and open items." },
  { label: "Due date", value: "Anchored to the institutional deadline that matters." },
  { label: "Status", value: "Open, in progress, waiting, or resolved." },
  { label: "Department", value: "Which office is accountable right now." },
  { label: "Dependencies", value: "What has to clear before this can close." },
  { label: "Activity", value: "A reviewable history of what changed and when." },
];

const signals = [
  { icon: Doc, title: "A student has an outstanding requirement", body: "The gap becomes an assigned task before it becomes a hold." },
  { icon: Clock, title: "A deadline approaches", body: "Time-sensitive items rise in the queue automatically." },
  { icon: Mail, title: "A message arrives", body: "Inbound student questions become trackable work with context attached." },
  { icon: Pulse, title: "A risk signal appears", body: "Emerging patterns surface as work rather than as a report nobody opens." },
];

export default function ActionCenterPage() {
  return (
    <>
      <PageHero
        eyebrow="Action Center"
        title="Every important action needs an owner."
        lede="The Audentra Action Center converts student needs, institutional priorities, messages, and operational signals into clear, trackable work."
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              Explore the Action Center
            </Btn>
            <Btn href="/#capabilities" variant="outlineLight">
              See all capabilities
            </Btn>
          </>
        }
        aside={
          <AppFrame>
            <LiveActionCenter />
          </AppFrame>
        }
      />

      {/* From signal to resolution */}
      <Section>
        <SectionHead
          eyebrow="From signal to resolution"
          title="Information becomes work that can actually be finished."
          lede="Audentra turns institutional signals into work that can be assigned, prioritized, coordinated, and completed."
        />
        <Cols items={signals} />
      </Section>

      {/* Anatomy of a task */}
      <Section tone="paper">
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow">Anatomy of an action</span>
            <h2 className="au-h2">Nine fields that end the &ldquo;who owns this?&rdquo; conversation.</h2>
            <p className="au-lede">
              Cross-departmental work fails on ambiguity, not effort. Every Audentra action carries the
              information required to move it forward without a meeting.
            </p>
            <div className="au-grid au-grid--2" style={{ marginTop: "2rem", gap: "0.75rem" }}>
              {fields.map((field) => (
                <div
                  key={field.label}
                  style={{
                    padding: "0.85rem 1rem",
                    border: "1px solid var(--au-line)",
                    borderRadius: "12px",
                    background: "#fff",
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.875rem" }}>{field.label}</strong>
                  <span style={{ color: "var(--au-ink-faint)", fontSize: "0.8125rem" }}>{field.value}</span>
                </div>
              ))}
            </div>
          </div>

          <Panel label="Task detail" flat>
            <div className="pm__head">
              <span className="pm__title">Resolve financial clearance</span>
              <span className="pm-badge pm-badge--high">High</span>
            </div>
            <div className="pm-rows">
              <Row icon={<Users size={13} />} title="Owner" meta="M. Alvarez · Financial Aid" priority="low" />
              <Row icon={<Doc size={13} />} tone="purple" title="Student" meta="Sarah Johnson · admitted, deposit paid" priority="low" />
              <Row icon={<Clock size={13} />} title="Due" meta="Today · housing deadline in 6 days" priority="high" />
              <Row icon={<Layers size={13} />} tone="teal" title="Depends on" meta="Verification document upload" priority="medium" />
              <Row icon={<Check size={13} />} tone="teal" title="Deposit confirmed" meta="Student Accounts · May 1" priority="done" />
            </div>
            <div className="pm-brew__section">
              <span className="pm-brew__label">Activity</span>
              <div className="pm-rows">
                <Row icon={<Mail size={13} />} title="Outreach drafted by EDward" meta="Awaiting counselor review · 09:42" priority="medium" />
                <Row icon={<Route size={13} />} tone="purple" title="Reassigned from Admissions" meta="Cross-office handoff · yesterday" priority="low" />
              </div>
            </div>
          </Panel>
        </div>
      </Section>

      {/* Coordination */}
      <Section tone="navy" mesh>
        <div className="au-featurerow au-featurerow--flip">
          <div>
            <span className="au-eyebrow au-eyebrow--light">Coordination</span>
            <h2 className="au-h2">Work that crosses offices stops falling between them.</h2>
            <p className="au-lede">
              A single enrollment decision can touch Admissions, Financial Aid, Student Accounts,
              Housing, and the Registrar. The Action Center makes the handoffs explicit.
            </p>
            <CheckList
              items={[
                {
                  title: "Shared queues with real ownership",
                  body: "Each item has a person, a department, and a deadline.",
                },
                {
                  title: "Dependencies made visible",
                  body: "Teams can see what they are waiting on and who is waiting on them.",
                },
                {
                  title: "Escalation before it becomes melt",
                  body: "Items past service levels surface to leaders automatically.",
                },
              ]}
            />
            <div className="au-btn-row">
              <Btn href="/solutions/enrollment-readiness" variant="light" icon={<ArrowRight />}>
                See it applied to enrollment readiness
              </Btn>
            </div>
          </div>

          <Cols
            items={[
              {
                icon: Wallet,
                title: "Financial Aid",
                body: "Open items, median time to clear, and anything past service level.",
              },
              {
                icon: Doc,
                title: "Admissions",
                body: "Documents outstanding and which students they are blocking.",
              },
              {
                icon: Bolt,
                title: "Student Accounts",
                body: "Holds and deposits, with the deadline each one sits against.",
              },
            ]}
          />
        </div>
      </Section>

      <CtaBand
        title="Bring one stuck workflow to the conversation."
        lede="We'll map it into the Action Center and show you what changes on day one."
        secondary={{ href: "/platform/morning-brew", label: "Next: Morning Brew" }}
      />
    </>
  );
}
