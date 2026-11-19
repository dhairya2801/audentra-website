import { Container, Waves } from "@/components/ui";
import { SupportForm } from "./support-form";
export const metadata = {
  title: "Customer Support",
  description: "Report an issue with your Audentra portal.",
};
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const { portal } = await searchParams;
  return (
    <section className="au-pagehero au-mesh">
      <Waves />
      <Container>
        <div className="au-pagehero__grid">
          <div>
            <h1 className="au-h1">Customer support</h1>
            <p className="au-lede">
              Tell us what happened in your Audentra portal.
            </p>
          </div>
          <SupportForm portal={portal || ""} />
        </div>
      </Container>
    </section>
  );
}
