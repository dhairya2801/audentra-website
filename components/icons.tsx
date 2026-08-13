import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ---------- Interface ---------- */

export const ArrowRight = (p: IconProps) => (
  <Svg size={16} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ChevronDown = (p: IconProps) => (
  <Svg size={15} {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const ChevronRight = (p: IconProps) => (
  <Svg size={15} {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg size={16} strokeWidth={2.4} {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </Svg>
);

export const Play = (p: IconProps) => (
  <Svg size={16} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10.2 8.8 15.5 12l-5.3 3.2z" fill="currentColor" stroke="none" />
  </Svg>
);

export const Send = (p: IconProps) => (
  <Svg size={16} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Svg>
);

/* ---------- Product ---------- */

/** EDward — conversational assistant */
export const Chat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 12a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.5-.77L4 20.5l1.3-4.6A8 8 0 1 1 20.5 12Z" />
    <path d="M9 11h6M9 14.2h3.5" />
  </Svg>
);

/** Action Center — prioritized work */
export const Clipboard = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4.5h6a1 1 0 0 1 1 1V7H8V5.5a1 1 0 0 1 1-1Z" />
    <path d="M16 6h2a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 6 6h2" />
    <path d="m9 13 1.8 1.8L15 10.8" />
  </Svg>
);

/** Morning Brew — daily intelligence */
export const Cup = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 9h12v5.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5V9Z" />
    <path d="M16.5 10.5H18a2.5 2.5 0 0 1 0 5h-1.5" />
    <path d="M8 3.2c-.8 1-.8 1.9 0 2.9M12 3.2c-.8 1-.8 1.9 0 2.9" />
  </Svg>
);

/** Student experience */
export const Cap = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 5 9 4-9 4-9-4 9-4Z" />
    <path d="M7 11v4.2c0 .5.3 1 .8 1.2 1.2.6 2.7 1.1 4.2 1.1s3-.5 4.2-1.1c.5-.2.8-.7.8-1.2V11" />
    <path d="M20 9.4V15" />
  </Svg>
);

/** Risk intelligence */
export const Pulse = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12.5h3.5L9 6.5l3.5 11L15 12.5h6" />
  </Svg>
);

/** Communication intelligence */
export const Mail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.8 7 7.3 5.3a1.5 1.5 0 0 0 1.8 0L20.2 7" />
  </Svg>
);

/** Identify — scanning a population for what needs attention */
export const Search = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.8" cy="10.8" r="6.4" />
    <path d="m15.6 15.6 4.2 4.2" />
  </Svg>
);

/** Prioritize — a ranked queue */
export const Sort = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.6h13M4 12h8.5M4 17.4h4.5" />
    <path d="M18.6 9.4v9M16.2 16.2l2.4 2.4 2.4-2.4" />
  </Svg>
);

/** Resolve — closed and confirmed */
export const CheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="m8.4 12.2 2.4 2.4 4.8-5" />
  </Svg>
);

/* ---------- Value / concept ---------- */

export const Network = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="2.2" />
    <circle cx="5" cy="18" r="2.2" />
    <circle cx="19" cy="18" r="2.2" />
    <path d="M10.6 6.9 6.4 16.1M13.4 6.9l4.2 9.2M7.2 18h9.6" />
  </Svg>
);

export const Lightbulb = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.2 16.5a5.5 5.5 0 1 1 5.6 0v1.7a1.3 1.3 0 0 1-1.3 1.3h-3a1.3 1.3 0 0 1-1.3-1.3v-1.7Z" />
    <path d="M10 21.2h4" />
  </Svg>
);

export const Users = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9.5" cy="8.5" r="3" />
    <path d="M3.5 19.2a6 6 0 0 1 12 0" />
    <path d="M16.2 6.3a3 3 0 0 1 0 5.9M17.4 14.4a5.6 5.6 0 0 1 3.2 4.8" />
  </Svg>
);

export const Bolt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 3 5.8 13.2h5L10.2 21l7.8-10.3h-5L13.5 3Z" />
  </Svg>
);

export const Compass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.4 8.6-1.8 5-5 1.8 1.8-5 5-1.8Z" />
  </Svg>
);

export const Target = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const Shield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.2 19 6v5.6c0 4.2-2.9 7.6-7 9.2-4.1-1.6-7-5-7-9.2V6l7-2.8Z" />
    <path d="m9.2 12.2 1.9 1.9 3.7-3.9" />
  </Svg>
);

export const Lock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.8" y="10.5" width="14.4" height="9.2" rx="2" />
    <path d="M8.4 10.5V8.2a3.6 3.6 0 0 1 7.2 0v2.3" />
  </Svg>
);

export const Eye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.8 12S6.3 6.2 12 6.2 21.2 12 21.2 12 17.7 17.8 12 17.8 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.7" />
  </Svg>
);

export const Layers = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3.4 8.4 4.2-8.4 4.2-8.4-4.2L12 3.4Z" />
    <path d="m3.6 12 8.4 4.2 8.4-4.2M3.6 16.3l8.4 4.2 8.4-4.2" />
  </Svg>
);

export const Chart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16.5v-4M12.4 16.5V8.5M16.8 16.5v-6.4" />
  </Svg>
);

export const Building = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 20.5V6.2L12 3.5l7.5 2.7v14.3" />
    <path d="M3 20.5h18" />
    <path d="M9 20.5v-4.2h6v4.2M8.6 9.4h1.6M13.8 9.4h1.6M8.6 12.8h1.6M13.8 12.8h1.6" />
  </Svg>
);

export const Route = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="6.5" r="2.4" />
    <circle cx="18" cy="17.5" r="2.4" />
    <path d="M8.4 6.5h4.2a3.4 3.4 0 0 1 0 6.8h-2.2a3.4 3.4 0 0 0 0 6.8H15" />
  </Svg>
);

export const Clock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.4V12l3 1.8" />
  </Svg>
);

export const Doc = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 3.2H7a1.8 1.8 0 0 0-1.8 1.8v14a1.8 1.8 0 0 0 1.8 1.8h10a1.8 1.8 0 0 0 1.8-1.8V8.5l-5.3-5.3Z" />
    <path d="M13.4 3.4v5.2h5.2M8.8 13.6h6.4M8.8 16.6h4.4" />
  </Svg>
);

export const Wallet = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.6 8.4A2 2 0 0 1 5.6 6.4h11.6a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2V8.4Z" />
    <path d="M19.2 10.8h1.6v3.4h-1.6a1.7 1.7 0 0 1 0-3.4Z" />
  </Svg>
);

export const Refresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 1 1-2.5-5.8" />
    <path d="M20 4.2v4.4h-4.4" />
  </Svg>
);

export const Handshake = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 7.4-1.6-1.2a2.2 2.2 0 0 0-2.7.1L3.5 10" />
    <path d="m12 7.4 1.6-1.2a2.2 2.2 0 0 1 2.7.1L20.5 10" />
    <path d="M6 12.6 8.9 15a1.6 1.6 0 0 0 2.2-.2l.9-1 2 1.8a1.5 1.5 0 0 0 2.1-2.2l-4.1-3.6" />
  </Svg>
);

export const Heart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7.2-4.3-7.2-9.2A4 4 0 0 1 12 8.4a4 4 0 0 1 7.2 2.4C19.2 15.7 12 20 12 20Z" />
  </Svg>
);

export const Puzzle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 4.4h4v1.4a1.6 1.6 0 1 0 3.2 0V4.4h2.4v4h-1.4a1.6 1.6 0 1 0 0 3.2h1.4v8h-4v-1.4a1.6 1.6 0 1 0-3.2 0V19.6H4.4v-4h1.4a1.6 1.6 0 1 0 0-3.2H4.4v-4H10V4.4Z" />
  </Svg>
);

/* ---------- Accessibility ---------- */

export const Keyboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="6.5" width="18.4" height="11" rx="2" />
    <path d="M6.5 10h.01M9.7 10h.01M12.9 10h.01M16.1 10h.01M8.3 14.2h7.4" />
  </Svg>
);

export const Speaker = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5h3l4-3.4v11.8l-4-3.4H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <path d="M15 9.4a3.6 3.6 0 0 1 0 5.2M17.6 7a7.2 7.2 0 0 1 0 10" />
  </Svg>
);

export const Contrast = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 3.4a8.6 8.6 0 0 1 0 17.2V3.4Z" fill="currentColor" stroke="none" />
  </Svg>
);

export const TextSize = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 18 7.6 6.5 12.2 18M4.6 14.4h6" />
    <path d="M14 18l3.4-8 3.4 8M15.2 15.4h4.4" />
  </Svg>
);

export const Focus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
    <circle cx="12" cy="12" r="2.6" />
  </Svg>
);

export const FormIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2" />
    <path d="M7 9.2h6M7 13h10M7 16.2h4" />
  </Svg>
);

/* ---------- Social ---------- */

export const LinkedIn = (p: IconProps) => (
  <Svg size={17} strokeWidth={0} {...p}>
    <path
      fill="currentColor"
      d="M6.2 8.9H3.4V20h2.8V8.9ZM4.8 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM20.6 13.4c0-3-1.6-4.7-4-4.7a3.5 3.5 0 0 0-3.1 1.7h-.1V8.9H10.7V20h2.8v-5.5c0-1.5.3-2.9 2.1-2.9s1.8 1.6 1.8 3V20h2.8v-6.6Z"
    />
  </Svg>
);

export const Instagram = (p: IconProps) => (
  <Svg size={17} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.6" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="16.8" cy="7.2" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
