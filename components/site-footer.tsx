import Image from "next/image";
import Link from "next/link";
import { footerColumns, site } from "@/lib/site";
import { ArrowRight, Instagram, LinkedIn, XSocial } from "./icons";
import { Container } from "./ui";

export function SiteFooter() {
  return (
    <footer className="au-footer">
      <Container>
        <div className="au-footer__top">
          <div className="au-footer__brand">
            <Image
              src="/audentra-logo-light.png"
              alt="Audentra"
              width={1745}
              height={257}
            />
            <p>{site.tagline}</p>
            {/* Marks only — the accounts are not claimed yet, so these do not
                link anywhere. Wrap each in an <a> once the handles exist. */}
            <div className="au-footer__social" aria-hidden="true">
              <span>
                <LinkedIn />
              </span>
              <span>
                <XSocial />
              </span>
              <span>
                <Instagram />
              </span>
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
          <form className="au-newsform" action="/demo">
            <label htmlFor="footer-email" className="au-sr">
              Work email
            </label>
            <input
              id="footer-email"
              name="email"
              type="email"
              placeholder="Work email address"
              aria-label="Work email address"
            />
            <button type="submit" className="au-btn au-btn--primary" aria-label="Subscribe">
              <ArrowRight />
            </button>
          </form>
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
