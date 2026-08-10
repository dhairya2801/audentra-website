"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { nav } from "@/lib/site";
import { ArrowRight, ChevronDown } from "./icons";
import { Container } from "./ui";

/** Grace period so crossing the gap into a panel doesn't close it. */
const CLOSE_DELAY_MS = 140;

export function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef(0);
  const pathname = usePathname();
  const [navigatedFrom, setNavigatedFrom] = useState(pathname);

  // Any navigation closes everything. Adjusted during render rather than in an
  // effect so the menus never flash open on the new page.
  if (navigatedFrom !== pathname) {
    setNavigatedFrom(pathname);
    setOpenMenu(null);
    setDrawerOpen(false);
  }

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
  }, []);

  const openNow = useCallback(
    (label: string) => {
      cancelClose();
      setOpenMenu(label);
    },
    [cancelClose],
  );

  const closeSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <>
      <div className="au-announce">
        <Container>
          <div className="au-announce__inner">
            <span>
              Audentra is partnering with select institutions on focused enrollment workflows.
            </span>
            <Link href="/pilot">
              See the pilot program <ArrowRight size={14} />
            </Link>
          </div>
        </Container>
      </div>

      <header className="au-header" ref={headerRef}>
        <Container>
          <div className="au-header__inner">
            <Link href="/" className="au-logo" aria-label="Audentra home">
              <Image
                src="/audentra-logo-dark-text.png"
                alt="Audentra"
                width={1745}
                height={257}
                priority
              />
            </Link>

            <nav className="au-nav" aria-label="Primary">
              {nav.map((item, index) => {
                if (!item.columns) {
                  return (
                    <div className="au-nav__item" key={item.label}>
                      <Link href={item.href ?? "/"} className="au-nav__trigger">
                        {item.label}
                      </Link>
                    </div>
                  );
                }

                const isOpen = openMenu === item.label;
                // Panels near the right edge align to their right so they stay
                // inside the viewport.
                const alignEnd = index >= nav.length - 2;

                return (
                  <div
                    className="au-nav__item"
                    key={item.label}
                    onMouseEnter={() => openNow(item.label)}
                    onMouseLeave={closeSoon}
                    onFocus={() => openNow(item.label)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setOpenMenu(null);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="au-nav__trigger"
                      data-open={isOpen}
                      aria-expanded={isOpen}
                      onClick={() => (isOpen ? setOpenMenu(null) : openNow(item.label))}
                    >
                      {item.label}
                      <ChevronDown className="au-nav__chev" />
                    </button>

                    {isOpen ? (
                      // The wrapper's padding bridges the gap between trigger
                      // and panel, so the pointer never leaves the hover area.
                      <div className={alignEnd ? "au-mega-wrap au-mega-wrap--end" : "au-mega-wrap"}>
                        <div className="au-mega">
                          <div
                            className="au-mega__grid"
                            style={{ ["--cols" as string]: String(item.columns.length) }}
                          >
                            {item.columns.map((column, columnIndex) => (
                              <div key={column.title ?? columnIndex}>
                                {column.title ? <p className="au-mega__title">{column.title}</p> : null}
                                {column.links.map((link) => (
                                  <Link key={link.href} href={link.href} className="au-mega__link">
                                    <strong>{link.label}</strong>
                                    {link.description ? <span>{link.description}</span> : null}
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <button
              type="button"
              className="au-burger"
              data-open={drawerOpen}
              aria-expanded={drawerOpen}
              aria-controls="au-mobile-nav"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="au-header__actions">
              <Link href="/why-audentra" className="au-btn au-btn--outline">
                See How Audentra Works
              </Link>
              <Link href="/demo" className="au-btn au-btn--primary">
                Request a Pilot
              </Link>
            </div>
          </div>
        </Container>

        {drawerOpen ? (
          <div className="au-drawer" id="au-mobile-nav">
            <Container>
              {nav.map((item) =>
                item.columns ? (
                  <details key={item.label}>
                    <summary>
                      {item.label}
                      <ChevronDown className="au-nav__chev" />
                    </summary>
                    <div className="au-drawer__links">
                      {item.columns.flatMap((column) => column.links).map((link) => (
                        <Link key={link.href} href={link.href}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                ) : (
                  <Link key={item.label} href={item.href ?? "/"} className="au-drawer__flat">
                    {item.label}
                  </Link>
                ),
              )}
              <div className="au-drawer__cta">
                <Link href="/demo" className="au-btn au-btn--primary">
                  Request a Pilot
                </Link>
                <Link href="/why-audentra" className="au-btn au-btn--outline">
                  See How Audentra Works
                </Link>
              </div>
            </Container>
          </div>
        ) : null}
      </header>
    </>
  );
}
