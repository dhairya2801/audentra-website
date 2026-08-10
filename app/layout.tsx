import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import "./globals.css";
import "./product.css";

/**
 * Brand Identity Guidelines v1 §05: Satoshi is the brand typeface for headlines
 * and key messages; Inter is the system companion for body copy, UI, tables,
 * and data-heavy layouts. Inter is self-hosted via next/font; Satoshi comes
 * from Fontshare (a remote @import in globals.css is stripped by the
 * Tailwind/PostCSS pipeline, so the <link> below is the only reliable place).
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--au-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Institutional Intelligence for Higher Education`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — Institutional Intelligence for Higher Education`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  icons: {
    icon: "/audentra-mark.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap"
        />
      </head>
      <body>
        <a className="au-skip" href="#main">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
