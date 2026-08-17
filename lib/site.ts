export const site = {
  name: "Audentra",
  domain: "www.audentra.ai",
  url: "https://www.audentra.ai",
  tagline: "Institutional intelligence for what's next.",
  description:
    "Audentra is institutional intelligence for higher education. It connects signals across the systems institutions already run, gives teams one current view of student progress, and coordinates the next action across offices.",
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
        // Ordered as the operating sequence — see, understand, act, guide.
        links: [
          {
            label: "Morning Brew",
            href: "/platform/morning-brew",
            description: "See what changed and where attention is needed.",
          },
          {
            label: "EDward",
            href: "/platform/edward",
            description: "Ask what is happening with a student, and why.",
          },
          {
            label: "Action Center",
            href: "/platform/action-center",
            description: "Turn insight into owned, coordinated work.",
          },
          {
            label: "Student Experience",
            href: "/platform/student-experience",
            description: "Give students one clear path forward.",
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
            label: "Student Experience",
            href: "/solutions#student-experience",
            description: "Clearer requirements, guidance, and support.",
          },
        ],
      },
    ],
  },
  { label: "Why Audentra", href: "/why-audentra" },
  { label: "Trust", href: "/trust" },
  {
    label: "Company",
    columns: [
      {
        links: [
          { label: "About Audentra", href: "/about", description: "Why we're building this." },
          { label: "Pilot Program", href: "/pilot", description: "Prove the impact in one enrollment cycle." },
          { label: "Pricing", href: "/pricing", description: "How pilots and platform scope shape investment." },
        ],
      },
    ],
  },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Morning Brew", href: "/platform/morning-brew" },
      { label: "EDward", href: "/platform/edward" },
      { label: "Action Center", href: "/platform/action-center" },
      { label: "Student Experience", href: "/platform/student-experience" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Enrollment Readiness", href: "/solutions/enrollment-readiness" },
      { label: "Institutional Leadership", href: "/solutions#institutional-leadership" },
      { label: "Student Experience", href: "/solutions#student-experience" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why Audentra", href: "/why-audentra" },
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
