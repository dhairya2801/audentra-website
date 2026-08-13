import Image from "next/image";
import Link from "next/link";
import { footerColumns, site } from "@/lib/site";
import { Instagram, LinkedIn } from "./icons";
import { NewsletterForm } from "./newsletter-form";
import { Container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="au-footer">
      <Container>
        <div className="au-footer__top">
          <div className="au-footer__brand">
            <Image
              src="/audentra-main-logo.png"
              alt="Audentra"
              width={1177}
              height={287}
            />
            <div className="au-footer__social">
              <a
                href="https://www.linkedin.com/company/audentra-ai/"
                target="_blank"
                rel="noreferrer"
                aria-label="Audentra on LinkedIn"
              >
                <LinkedIn />
              </a>
              <a
                href="https://www.instagram.com/audentra.ai"
                target="_blank"
                rel="noreferrer"
                aria-label="Audentra on Instagram"
              >
                <Instagram />
              </a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4>{column.title}</h4>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="au-footer__news">
          <div>
            <strong>Stay in the know</strong>
            <p style={{ margin: "0.35rem 0 0" }}>
              Occasional insights on enrollment operations and institutional intelligence.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="au-footer__bottom">
          <span>&copy; {new Date().getFullYear()} Audentra, Inc. All rights reserved.</span>
          <nav aria-label="Legal">
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/trust">Trust</Link>
            <a href={site.url}>{site.domain}</a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
