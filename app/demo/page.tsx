import type { Metadata } from "next";
import { DemoForm } from "@/components/demo-form";
import { Container, CampusPhoto, Waves } from "@/components/ui";

export const metadata: Metadata = {
  title: "See Audentra in Action",
  description:
    "See Audentra applied to an enrollment priority at your institution. We'll tailor the walkthrough around your workflows, teams, and outcomes.",
};

export default function DemoPage() {
  return (
    <>
      <section className="au-pagehero au-mesh" style={{ paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>
        <Waves />
        <Container>
          <div className="au-pagehero__grid" style={{ alignItems: "start" }}>
            <div>
              <span className="au-eyebrow au-eyebrow--light">See Audentra in Action</span>
              <h1 className="au-h1">See your enrollment priorities in one coordinated view.</h1>
              <p className="au-lede">
                Tell us which student journey matters most to your institution. We&rsquo;ll tailor the
                conversation around your workflows, teams, and measures of progress.
              </p>

              <div style={{ marginTop: "2.5rem" }}>
                <CampusPhoto
                  priority
                  alt="A university campus building on a clear morning"
                  title="What to expect"
                  items={[
                    "Conversation tailored to your institution",
                    "Review of your current workflow",
                    "Relevant Audentra capabilities",
                    "Clear next steps",
                    "Space to decide the right next step",
                  ]}
                />
              </div>
            </div>

            <DemoForm />
          </div>
        </Container>
      </section>
    </>
  );
}
