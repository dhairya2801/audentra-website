import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { ArrowRight, Check } from "./icons";

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

/* ---------- Layout ---------- */

export function Container({
  children,
  narrow = false,
  className = "",
}: {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
}) {
  return (
    <div className={`${narrow ? "au-container--narrow" : "au-container"} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function Section({
  children,
  tone = "white",
  tight = false,
  line = false,
  mesh = false,
  id,
}: {
  children: ReactNode;
  tone?: "white" | "paper" | "navy";
  tight?: boolean;
  line?: boolean;
  mesh?: boolean;
  id?: string;
}) {
  const classes = [
    "au-section",
    tight && "au-section--tight",
    tone === "paper" && "au-section--paper",
    tone === "navy" && "au-section--navy",
    mesh && "au-mesh",
    line && "au-section--line",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section id={id} className={classes}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  light = false,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  light?: boolean;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "au-section-head" : undefined}>
      {eyebrow ? (
        <span className={light ? "au-eyebrow au-eyebrow--light" : "au-eyebrow"}>{eyebrow}</span>
      ) : null}
      <h2 className="au-h2">{title}</h2>
      {lede ? <p className="au-lede">{lede}</p> : null}
    </div>
  );
}

/* ---------- Actions ---------- */

type BtnVariant = "primary" | "dark" | "outline" | "outlineLight" | "light";

const btnClass: Record<BtnVariant, string> = {
  primary: "au-btn au-btn--primary",
  dark: "au-btn au-btn--dark",
  outline: "au-btn au-btn--outline",
  outlineLight: "au-btn au-btn--outline-light",
  light: "au-btn au-btn--light",
};

export function Btn({
  href,
  children,
  variant = "primary",
  icon,
}: {
  href: string;
  children: ReactNode;
  variant?: BtnVariant;
  icon?: ReactNode;
}) {
  return (
    <Link href={href} className={btnClass[variant]}>
      {children}
      {icon}
    </Link>
  );
}

export function ArrowLink({
  href,
  children,
  light = false,
}: {
  href: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link href={href} className={light ? "au-link au-link--light" : "au-link"}>
      {children}
      <ArrowRight />
    </Link>
  );
}

/* ---------- Cards ---------- */

export function FeatureCard({
  icon: Icon,
  title,
  body,
  href,
  cta,
  tone = "light",
}: {
  icon?: IconType;
  title: string;
  body: string;
  href?: string;
  cta?: string;
  tone?: "light" | "dark" | "teal";
}) {
  const iconClass =
    tone === "dark" ? "au-icon au-icon--dark" : tone === "teal" ? "au-icon au-icon--teal" : "au-icon";

  const inner = (
    <>
      {Icon ? (
        <span className={iconClass}>
          <Icon />
        </span>
      ) : null}
      <h3 className="au-h4">{title}</h3>
      <p className="au-body">{body}</p>
      {href && cta ? (
        <span className="au-card__foot">
          <span className="au-link">
            {cta}
            <ArrowRight />
          </span>
        </span>
      ) : null}
    </>
  );

  const className = `au-card${tone === "dark" ? " au-card--dark" : ""}${href ? " au-card--link" : ""}`;

  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export function CheckList({ items }: { items: { title: string; body?: string }[] }) {
  return (
    <ul className="au-checklist">
      {items.map((item) => (
        <li key={item.title}>
          <Check />
          <span>
            <strong>{item.title}</strong>
            {item.body ? <span>{item.body}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Editorial layouts (hairlines, not boxes) ---------- */

/**
 * A row of ideas divided by hairline rules. Replaces the card grid wherever
 * the content is a set of peers rather than a set of destinations.
 */
export function Cols({
  items,
  numbered = false,
}: {
  items: { icon?: IconType; title: string; body: string; key?: string }[];
  numbered?: boolean;
}) {
  return (
    <div className="au-cols" style={{ ["--cols" as string]: String(items.length) }}>
      {items.map((item, index) => (
        <div className="au-col" key={item.title}>
          {numbered ? (
            <span className="au-col__key">{String(index + 1).padStart(2, "0")}</span>
          ) : item.key ? (
            <span className="au-col__key">{item.key}</span>
          ) : item.icon ? (
            <item.icon size={24} />
          ) : null}
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}

/** Full-width index rows — used where each entry leads somewhere. */
export function LinkList({
  items,
}: {
  items: { name: string; kicker?: string; body: string; href: string }[];
}) {
  return (
    <div className="au-list">
      {items.map((item, index) => (
        <Link className="au-list__row" href={item.href} key={item.href}>
          <span className="au-list__key">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="au-list__name">
            {item.name}
            {item.kicker ? <span>{item.kicker}</span> : null}
          </h3>
          <p className="au-list__body">{item.body}</p>
          <span className="au-list__go" aria-hidden="true">
            <ArrowRight />
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Campus imagery with an optional floating card, per the brand direction. */
export function CampusPhoto({
  src = "/images/campus-quad.jpg",
  alt,
  title,
  items,
  priority = false,
}: {
  src?: string;
  alt: string;
  title?: string;
  items?: string[];
  priority?: boolean;
}) {
  return (
    <div className="au-photo">
      <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 980px) 100vw, 50vw" />
      {title && items ? (
        <div className="au-photo__card">
          <h3 className="au-h4">{title}</h3>
          <ul>
            {items.map((item) => (
              <li key={item}>
                <Check size={15} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Page furniture ---------- */

export function Waves() {
  return (
    <svg className="au-waves" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="au-wave-a" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6a38ff" stopOpacity="0" />
          <stop offset="45%" stopColor="#7f6bff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#00c49a" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="au-wave-b" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#1e5bff" stopOpacity="0.05" />
          <stop offset="60%" stopColor="#3d8bff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00c49a" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M0 156C220 96 420 196 706 140c286-56 452-124 734-78v158H0Z"
        fill="none"
        stroke="url(#au-wave-a)"
        strokeWidth="1.5"
      />
      <path
        d="M0 186C238 126 396 214 700 168c304-46 470-108 740-64v116H0Z"
        fill="none"
        stroke="url(#au-wave-b)"
        strokeWidth="1.5"
      />
      <path
        d="M0 214C260 158 404 232 716 194c312-38 452-92 724-52v78H0Z"
        fill="none"
        stroke="url(#au-wave-a)"
        strokeWidth="1"
        opacity="0.6"
      />
    </svg>
  );
}

export function PageHero({
  eyebrow,
  title,
  lede,
  actions,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="au-pagehero au-mesh">
      <Waves />
      <Container>
        {aside ? (
          <div className="au-pagehero__grid">
            <div>
              {eyebrow ? <span className="au-eyebrow au-eyebrow--light">{eyebrow}</span> : null}
              <h1 className="au-h1">{title}</h1>
              {lede ? <p className="au-lede">{lede}</p> : null}
              {actions ? <div className="au-btn-row">{actions}</div> : null}
            </div>
            <div>{aside}</div>
          </div>
        ) : (
          <div style={{ maxWidth: "48rem" }}>
            {eyebrow ? <span className="au-eyebrow au-eyebrow--light">{eyebrow}</span> : null}
            <h1 className="au-h1">{title}</h1>
            {lede ? <p className="au-lede">{lede}</p> : null}
            {actions ? <div className="au-btn-row">{actions}</div> : null}
          </div>
        )}
      </Container>
    </header>
  );
}

export function CtaBand({
  title,
  sub,
  lede,
  primary = { href: "/demo", label: "Request a Demo" },
  secondary,
}: {
  title: ReactNode;
  sub?: ReactNode;
  lede?: ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="au-cta">
      <Waves />
      <Container>
        <div className="au-cta__inner">
          <h2 className="au-h1">{title}</h2>
          {sub ? (
            <h3 className="au-h2" style={{ marginTop: "0.5rem", opacity: 0.86 }}>
              {sub}
            </h3>
          ) : null}
          {lede ? <p className="au-lede">{lede}</p> : null}
          <div className="au-btn-row">
            <Btn href={primary.href} variant="light" icon={<ArrowRight />}>
              {primary.label}
            </Btn>
            {secondary ? (
              <Btn href={secondary.href} variant="outlineLight">
                {secondary.label}
              </Btn>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
