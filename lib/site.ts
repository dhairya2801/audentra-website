export const site = {
  name: "Audentra",
  domain: "www.audentra.ai",
  url: "https://www.audentra.ai",
  tagline: "Institutional intelligence for what's next.",
  description:
    "Audentra is the Higher Education Intelligence Platform. It connects institutional data, workflows, and people so colleges and universities can see what matters, coordinate action, and move work forward.",
};

export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type NavItem = {
  label: string;
  href?: string;
  columns?: { title?: string; links: NavLink[] }[];
};

export const nav: NavItem[] = [
  {
    label: "Platform",
    columns: [
      {
        links: [
          {
            label: "EDward",
            href: "/platform/edward",
            description: "The institutional AI assistant.",
          },
          {
            label: "Action Center",
            href: "/platform/action-center",
            description: "Operational work management.",
          },
          {
            label: "Morning Brew",
            href: "/platform/morning-brew",
            description: "Daily institutional intelligence.",
          },
          {
            label: "Student Experience",
            href: "/platform/student-experience",
            description: "A guided enrollment journey.",
          },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    columns: [
      {
        links: [
          {
            label: "Enrollment Readiness",
            href: "/solutions/enrollment-readiness",
            description: "Turn commitment into enrollment.",
          },
          {
            label: "Institutional Leadership",
            href: "/solutions#institutional-leadership",
            description: "Connect operational activity to strategic outcomes.",
          },
          {
            label: "Students",
            href: "/solutions#students",
            description: "Clearer requirements, guidance, and support.",
          },
        ],
      },
    ],
  },
  { label: "Why Audentra", href: "/#why-audentra" },
  { label: "Resources", href: "/resources" },
  {
    label: "Company",
    columns: [
      {
        links: [
          { label: "About Audentra", href: "/about", description: "Why we're building this." },
          { label: "Pilot Program", href: "/pilot", description: "Build the next operating model with us." },
          { label: "Trust", href: "/trust", description: "Security, governance, responsible AI." },
          { label: "Contact", href: "/demo", description: "Talk with the team." },
        ],
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "EDward", href: "/platform/edward" },
      { label: "Action Center", href: "/platform/action-center" },
      { label: "Morning Brew", href: "/platform/morning-brew" },
      { label: "Student Experience", href: "/platform/student-experience" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Enrollment Readiness", href: "/solutions/enrollment-readiness" },
      { label: "Institutional Leadership", href: "/solutions#institutional-leadership" },
      { label: "Students", href: "/solutions#students" },
    ],
  },
  {
    // The library is a single page today and every item is marked "coming
    // soon", so these all resolve there rather than to anchors that
    // do not exist. Split them out when the resources ship.
    title: "Resources",
    links: [
      { label: "Insights", href: "/resources" },
      { label: "Reports", href: "/resources" },
      { label: "Guides", href: "/resources" },
      { label: "Webinars", href: "/resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why Audentra", href: "/#why-audentra" },
      { label: "About", href: "/about" },
      { label: "Pilot Program", href: "/pilot" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Accessibility", href: "/accessibility" },
      { label: "Trust & Security", href: "/trust" },
    ],
  },
];
