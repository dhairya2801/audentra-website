# Audentra — company website

The public marketing site for Audentra, the Higher Education Intelligence
Platform. Built as a standalone Next.js app so it can deploy independently of
the product portals in `../Audentra-portals`.

The structure and page rhythm follow an enterprise platform site (Databricks was
the reference), rendered in Audentra's brand: deep navy grounds, royal
blue/purple/teal gradients, and clean white content sections between the
high-colour moments.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run build      # static production build
npm run start      # serve the production build
npm run lint
npm run typecheck
```

Node 22 (`>=22.13.0 <23`), matching the portals repo.

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (loaded for its reset
and utilities; the visual system is a hand-written design system in
`app/globals.css`). Every route prerenders as static content.

## Layout

```text
app/
  globals.css               design system: tokens, layout, typography, components
  product.css               product UI mock styles (EDward, Action Center, …)
  layout.tsx                shell, metadata, Satoshi webfont link
  page.tsx                  home — also serves as the platform overview (see below)
  platform/                 EDward, Action Center, Morning Brew, Student Experience
  solutions/                solutions index + enrollment-readiness (the wedge page)
  trust/ pricing/ pilot/ resources/ about/ demo/
  accessibility/ legal/     accessibility statement, privacy, terms
components/
  site-header.tsx           sticky header, mega menu, mobile drawer
  site-footer.tsx           dark mega-footer
  ui.tsx                    Section, SectionHead, Btn, FeatureCard, CtaBand, …
  icons.tsx                 inline SVG icon set
  tabs.tsx                  accessible tab component
  demo-form.tsx             demo request form
  product/mocks.tsx         hand-built product UI compositions
lib/site.ts                 nav, footer, and site constants
scripts/build-logo-variants.mjs
```

### Brand

Tokens and type follow **Audentra Brand Identity Guidelines v1**
(`../Audentra_Brand_Identity_Guidelines_v1.pdf`).

**Colour (§04).** Primary `--au-purple #6A38FF`, `--au-blue #1E5BFF`,
`--au-teal #00C49A`, `--au-navy #0A1F44`, plus the published tints and shades
(`--au-purple-soft`, `--au-blue-pale`, …) for hierarchy without new hues.
Neutrals are the guideline set: White, Cloud `#F2F4F7`, Mist `#EAECF0`,
Slate `#98A2B3`, Graphite `#667085`, Ink `#101828`.

**Type (§05).** Satoshi is the brand face for display and headings
(`--au-font-display`); Inter is the system companion for body copy, UI, tables,
and the data-heavy product mocks (`--au-font-body`). Sizes follow the published
hierarchy — Display 44–60px, H1 36–44, H2 26–32, Subheading 18–22, Body 15–18,
Caption 11–13. Inter is self-hosted via `next/font`; Satoshi loads from
Fontshare through a `<link>` in `app/layout.tsx`, because a remote `@import`
inside `globals.css` is stripped by the Tailwind/PostCSS pipeline.

**Logo (§03).** The horizontal lockup is `[A-mark] + UDENTRA` — the mark *is*
the first letter. Do not set "AUDENTRA" after the mark; that is a documented
usage error. The source PNG is already correct (glyph segmentation confirms
seven wordmark glyphs). Never remove the teal crossbar, and never add shadows,
glows, or outlines to the mark.

**Icons (§07).** Line-based, single style, 1.5–2.0px equivalent strokes —
`components/icons.tsx` draws everything at `strokeWidth={1.7}`.

### Home is the platform overview

The two pages covered the same ground and were merged into `app/page.tsx`.
`/platform` 308-redirects to `/` (see `next.config.ts`); `/#platform` is the
anchor on the capabilities section that nav, 404, and product pages point at.

The homepage tells one story, in this order:

1. **Hero** — "Turn student intent into enrollment", with the Morning Brief
   product surface and the connect → understand → decide → act motif
2. **The enrollment gap** — scattered signals, late decisions, manual action,
   resolving into one operating layer
3. **The platform** (`id="platform"`) — Morning Brew, EDward, Action Center,
   Student Experience, ordered as understand → decide → act → guide
4. **Outcomes** — yield, completion, staff focus, student confidence
5. **Enrollment readiness** — the wedge, as one concrete example
6. **How it works** — the architecture, systems through to role-aware experiences
7. **Enterprise trust** — the four governance principles
8. **Final CTA** — start with one measurable enrollment problem

"Institutional intelligence for what's next." is the enduring brand tagline and
lives in the footer, not the hero.

Deliberately not on the homepage, to keep one strong statement per idea: the
five-step operating model (now the hero motif), the "also included" capability
list (covered on product pages), a second product index (the platform tabs link
out directly), and the Why Audentra card set (it has its own route).

### Layout vocabulary

Rows of peer ideas use `Cols` (hairline-divided columns) and rows of
destinations use `LinkList` (numbered index rows). Cards are reserved for things
that genuinely are cards — resource tiles and the 404 signposts. If you add a
section, reach for a hairline before a box.

### Product mocks

`components/product/` builds the product surfaces as real markup rather than
screenshots, so they stay crisp at any size and restyle with the tokens:

- `morning-brief.tsx` — the hero surface. Plays the reasoning chain the platform
  is built around (signal → interpretation → opportunity → recommended action →
  human approval) one step at a time, holds on the finished state, then runs
  again. The insight block reserves its full height so nothing shifts.
- `live-readiness.tsx` — enrollment readiness filtered by cohort. Not currently
  placed on a page; kept because it is a complete, reusable surface.
- `live-edward.tsx` — the briefed conversation played back turn by turn, with a
  typing indicator, autoscroll, and a loop. Used in the Meet EDward section and
  on the EDward page; the hero uses the static `EdwardChat` so the two panels
  don't compete.
- `brew-pulse.tsx` — Morning Brew's Enrollment Pulse: timeframe pills
  (Live/1D/1W/1M/1Y), values that count to their new target, sparklines, target
  progress, and today's priorities. "Live" rotates the window every 4.6s;
  clicking a window pins it. Mirrors `staff/morning-brew/pulse.tsx` in the
  portals repo.
- `live-action-center.tsx` — the queue working itself down: tasks resolve one at
  a time, rows settle into their resolved state, the open counter ticks down.
- `live-student-journey.tsx` — a transcript uploading, verifying, and releasing
  financial aid, which advances the journey rail one stage.
- `workload-board.tsx` — the leader view: queue depth by office with capacity
  bars against service level, plus bottlenecks and escalations. Deliberately
  *not* a KPI ticker, so it doesn't repeat the executive pulse.
- `mocks.tsx` — the static surfaces: `EdwardChat`, readiness overview, Action
  Center queue, student journey, and the app frame.

All animation honours `prefers-reduced-motion` (the conversation renders whole,
the pulse stops rotating) and pauses while off screen via IntersectionObserver.
Swap any of it for real product captures when those exist.

The numbers inside these mocks are sample interface data, the same as any
product screenshot. They are not institutional results and are not presented as
such anywhere in the copy.

## Content

Copy comes from the two source documents in
`../[252] Page Content/` (`AUDENTRA Website Copy-Sample.docx` is the designer
build brief; `Audentra Page Content.docx` covers About/Why Us/Solutions), and the
layout direction from the samples in `../[251] Brand & Design/`.

Two positioning rules from the brief are load-bearing and worth preserving in
edits:

- Audentra sells **institutional intelligence**, not "AI for colleges." AI is how
  parts of the product work, not the whole story.
- No compliance badges (SOC 2, FERPA, HIPAA, ISO) are published anywhere,
  because none have been claimed. `/trust` says so explicitly.

## Assets

`public/audentra-logo.png` is the approved horizontal logo. Two web variants are
derived from it:

```bash
node scripts/build-logo-variants.mjs
```

- `audentra-logo-dark-text.png` — navy wordmark, transparent, for light surfaces
- `audentra-logo-light.png` — white wordmark, transparent, for the dark footer
- `audentra-mark.png` — the A-mark alone, squared, used as the favicon

All are trimmed of the source canvas padding. The gradient A-mark is preserved
untouched (§03 forbids removing the teal crossbar); only the wordmark is
recoloured. Re-run the script if the source logo is replaced.

## Illustrative data

Every figure inside a product mock is demo data, the same as any product
screenshot — the hero panel labels itself "Illustrative data" in its chrome. No
customer results, testimonials, named institutions, or ROI claims appear
anywhere on the site.

## Before launch

These are deliberate placeholders, not oversights:

1. **Demo form** (`components/demo-form.tsx`) confirms in the browser and posts
   nowhere. Point it at your CRM endpoint (HubSpot, Salesforce Web-to-Lead, or a
   route handler). The footer newsletter form needs the same treatment.
2. **No results claims anywhere.** The site carries no outcome statistics, no
   testimonials, and no named customers, because none have been verified. The
   design comps in `../[251] Brand & Design/` show an 18% / 2.6x / 250+ stat
   band, a VP quote, and a Pace/NSU/NYIT/Webster logo wall — all of it was
   removed. Add it back only once the figures are substantiated and each
   institution has approved being named; there are natural slots on the home
   page (after the audience tabs) and on `/solutions/enrollment-readiness`
   (the "What changes" section).
3. **Photography** — `public/images/campus-quad.jpg` is a placeholder borrowed
   from the portals repo. Guidelines §06 calls for four territories — campus
   operations, people doing the work, connected information, student momentum —
   with generous negative space and one focal point, and explicitly rules out
   staged corporate stock and "AI" clichés. Commission or license that before
   launch.
4. **Legal** — `/legal/privacy` and `/legal/terms` state the approach and are
   marked as placeholders pending counsel. `/accessibility` states the WCAG 2.2
   AA target without claiming validated conformance.
5. **Resources** — every card shows "Coming soon" per the brief's instruction not
   to imply the library already exists.
6. **Social marks** in the footer render as icons only — the accounts are not
   claimed, so nothing links out. Wrap each in an `<a>` once the handles exist
   (`components/site-footer.tsx`).
7. **No careers page.** There is no hiring content; add one when there are roles
   to list, and restore the Company nav and footer entries alongside it.

## Accessibility

Targets WCAG 2.2 AA. Skip link, semantic landmarks, labelled forms, visible
focus rings that are never suppressed, keyboard-operable menus and tabs
(arrow-key roving tabindex), `prefers-reduced-motion` honoured, and no
information conveyed by colour alone. Verify with an audit before launch — the
`/accessibility` page deliberately stops short of claiming validated conformance.

## Deploying

Static output, so any Next-capable host works. For Vercel: import the directory,
framework preset Next.js, no environment variables required. Update `site.url`
in `lib/site.ts` if the production domain differs from `www.audentra.ai` — it
feeds canonical metadata, `sitemap.xml`, and `robots.txt`.
