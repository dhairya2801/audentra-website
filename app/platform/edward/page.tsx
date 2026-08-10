import type { Metadata } from "next";
import { LiveEdward } from "@/components/product/live-edward";
import { Panel, Row } from "@/components/product/mocks";
import { ArrowRight, Check, Doc, Eye, Handshake, Layers, Lock, Shield, Users } from "@/components/icons";
import {
  Btn,
  CheckList,
  Cols,
  Container,
  CtaBand,
  PageHero,
  Section,
  SectionHead,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "EDward — the conversational interface to institutional intelligence",
  description:
    "Ask your institution what's happening — and what should happen next. EDward answers from approved institutional knowledge, then helps move the work forward with people still in control.",
};

const staffQuestions = [
  "What does this student still need?",
  "Why is this student in my priority queue?",
  "Which deposited students have unresolved aid requirements?",
  "Show me students with deadlines in the next seven days.",
  "Why did transfer readiness decline this week?",
  "Which students are waiting on more than one office?",
  "Summarize their enrollment status.",
  "What should happen next?",
  "Draft an outreach message.",
];

const trust = [
  {
    icon: Layers,
    title: "Approved sources",
    body: "EDward is designed around institutional information your team has approved for use.",
  },
  {
    icon: Eye,
    title: "Source visibility",
    body: "Responses show the institutional knowledge they were drawn from, so answers can be checked.",
  },
  {
    icon: Lock,
    title: "Role-aware access",
    body: "A student and a financial aid counselor asking the same question do not get the same answer.",
  },
  {
    icon: Handshake,
    title: "Human handoff",
    body: "When an answer requires human expertise, EDward moves the conversation to the right person.",
  },
];

export default function EdwardPage() {
  return (
    <>
      <PageHero
        eyebrow="EDward — Understand"
        title={
          <>
            Ask your institution what&rsquo;s happening &mdash;
            <br />
            and what should happen next.
          </>
        }
        lede={
          <>
            EDward is the conversational interface to Audentra&rsquo;s institutional intelligence.
            Staff can ask about a student, requirement, policy, blocker, or next step and receive an
            answer grounded in approved institutional knowledge and the context their role allows
            them to see.
            <br />
            <br />
            And when information needs to become action, EDward can help move the work forward
            &mdash; with people still in control.
          </>
        }
        actions={
          <>
            <Btn href="/demo" icon={<ArrowRight />}>
              See EDward in Action
            </Btn>
            <Btn href="/#platform" variant="outlineLight">
              See all capabilities
            </Btn>
          </>
        }
        aside={<LiveEdward height="21rem" />}
      />

      {/* The competitive frame, stated before anything else. */}
      <Section tone="navy" mesh tight>
        <div className="au-section-head">
          <span className="au-eyebrow au-eyebrow--light">The positioning</span>
          <h2 className="au-h2">Not another chatbot. A path from question to action.</h2>
          <p className="au-lede">
            A chatbot ends the conversation with information. EDward ends it with a task, an owner,
            and a next step &mdash; still governed by the people accountable for the outcome.
          </p>
        </div>
        <Cols
          items={[
            {
              icon: Shield,
              title: "Permissions preserved",
              body: "EDward never exposes information a person's role would not already allow.",
            },
            {
              icon: Eye,
              title: "Reviewable output",
              body: "Drafted messages and proposed actions wait for a person before anything leaves the institution.",
            },
            {
              icon: Layers,
              title: "Auditable trail",
              body: "Relevant actions can be tracked and reviewed after the fact.",
            },
          ]}
        />
      </Section>

      {/* Staff */}
      <Section>
        <div className="au-featurerow">
          <div>
            <span className="au-eyebrow">For staff</span>
            <h2 className="au-h2">Spend less time searching. More time helping.</h2>
            <p className="au-lede">
              The context a counselor needs is usually spread across four systems and two inboxes.
              EDward assembles it in one question.
            </p>
            <ul className="au-questions" style={{ gridTemplateColumns: "1fr" }}>
              {staffQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>

          <Panel label="Staff view" flat>
            <div className="pm__head">
              <span className="pm__title">Sarah Johnson &mdash; enrollment summary</span>
              <span className="pm__more">Open profile</span>
            </div>
            <div className="pm-rows">
              <Row icon={<Doc size={13} />} tone="purple" title="Verification documents" meta="Requested 12 days ago · no response" priority="high" />
              <Row icon={<Check size={13} />} title="Deposit received" meta="Confirmed May 1" priority="done" />
              <Row icon={<Users size={13} />} tone="teal" title="Assigned counselor" meta="M. Alvarez · Financial Aid" priority="low" />
            </div>
            <div className="pm-msg pm-msg--bot" style={{ marginTop: "0.75rem", maxWidth: "100%" }}>
              <b>EDward summary</b>
              Sarah is one document short of financial clearance. Aid packaging is paused, and the
              housing deadline is in six days. Recommended next action: request the missing verification
              form with a deadline-aware message.
            </div>
          </Panel>
        </div>
      </Section>

      {/* Students */}
      <Section tone="paper">
        <div className="au-featurerow au-featurerow--flip">
          <div>
            <span className="au-eyebrow">For students</span>
            <h2 className="au-h2">Answers without the institutional maze.</h2>
            <p className="au-lede">
              Students use EDward to better understand requirements, policies, financial information,
              enrollment steps, and available support. When an answer requires human expertise, EDward
              helps move the conversation to the right person.
            </p>
            <CheckList
              items={[
                {
                  title: "Plain-language explanations",
                  body: "Policy language translated into what the student actually needs to do.",
                },
                {
                  title: "Their own status, not a generic FAQ",
                  body: "Requirements, deadlines, and progress specific to that student.",
                },
                {
                  title: "A real person when it matters",
                  body: "Escalation to the office that owns the answer, with context attached.",
                },
              ]}
            />
          </div>

          <Panel label="Student view" flat>
            <div className="pm-edward__thread" style={{ padding: 0 }}>
              <div className="pm-msg pm-msg--user">Why is my financial aid still pending?</div>
              <div className="pm-msg pm-msg--bot">
                <b>EDward</b>
                Your aid package is waiting on one verification form. Once the Financial Aid office
                receives it, packaging typically completes within three business days.
                <ul>
                  <li>
                    <Doc size={13} />
                    <span>Upload: Verification of Non-Filing letter</span>
                  </li>
                </ul>
              </div>
              <div className="pm-msg pm-msg--user">Can someone help me find that form?</div>
              <div className="pm-msg pm-msg--bot">
                <b>EDward</b>
                Yes &mdash; I&rsquo;ve shared your question with Financial Aid along with your current
                status. You should hear back within one business day.
              </div>
            </div>
          </Panel>
        </div>
      </Section>

      {/* Trust */}
      <Section>
        <SectionHead
          eyebrow="Trust"
          title="Grounded in institutional knowledge."
          lede="EDward is designed around approved institutional information, with the oversight higher education requires."
        />
        <Cols items={trust} />
        <Container>
          <p className="au-body" style={{ marginTop: "2rem", textAlign: "center" }}>
            <Btn href="/trust" variant="outline" icon={<ArrowRight />}>
              How Audentra handles trust and governance
            </Btn>
          </p>
        </Container>
      </Section>

      <CtaBand
        title="See EDward answer a question from your institution."
        lede="Bring a real scenario. We'll walk through how EDward would handle it inside your workflow."
        secondary={{ href: "/platform/action-center", label: "Next: Action Center" }}
      />
    </>
  );
}
