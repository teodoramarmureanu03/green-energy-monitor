---
name: EU Renewables Monitor
description: A live European renewable-energy dashboard for investors and analysts, tracking solar/wind capacity and output by country.
colors:
  forest: "#12541d"
  forest-mid: "#1c6b2a"
  sage-tint: "#dde9df"
  indigo-deep: "#192168"
  steel-navy: "#22364e"
  charcoal: "#32373c"
  sentry-teal: "#03bdc2"
  surface: "#ffffff"
  ink: "#111827"
  slate: "#374151"
  muted: "#6b7280"
  mist: "#f4f6f4"
  border-sage: "#dde3de"
  zinc-50: "#fafafa"
  zinc-200: "#e4e4e7"
  zinc-400: "#a1a1aa"
  zinc-600: "#52525b"
  zinc-900: "#18181b"
  wind-blue: "#2563eb"
  solar-amber: "#f59e0b"
  hydro-cyan: "#06b6d4"
  geothermal-red: "#ef4444"
  biomass-green: "#16a34a"
  tidal-sky: "#0ea5e9"
  investment-violet: "#8b5cf6"
  error-red: "#dc2626"
  error-bg: "#fef2f2"
  error-border: "#fecaca"
typography:
  display:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "52px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.3px"
  body:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
  3xl: "56px"
  4xl: "72px"
components:
  kpi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "22px 24px"
  hero-kpi-card:
    backgroundColor: "{colors.indigo-deep}"
    textColor: "{colors.sentry-teal}"
    rounded: "{rounded.2xl}"
    padding: "32px 36px"
  section-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "28px"
  nav-item-active:
    backgroundColor: "{colors.sentry-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "rgba(255,255,255,0.6)"
    rounded: "{rounded.md}"
    padding: "12px"
  pill-badge:
    backgroundColor: "{colors.sage-tint}"
    textColor: "{colors.forest}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  select-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  segmented-control:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.muted}"
    rounded: "{rounded.xl}"
    padding: "3px"
---

# Design System: EU Renewables Monitor

## 1. Overview

**Creative North Star: "The Grid Readout"**

This is an instrument, not a brochure — and it now reads as a sibling product to its parent brands rather than a standalone consumer eco-app. [enevogroup.com](https://enevogroup.com) and [sentryot.com](https://sentryot.com) set the identity: corporate, credentials-forward, dark-neutral-led, with green (Enevo) or teal (SentryOT) as one disciplined accent rather than the dominant hue. This system pulls Forest Green directly from Enevo's palette, adds SentryOT's teal as the second brand-level accent, and pairs both against Indigo Deep and Charcoal — Enevo's own dark neutrals — instead of the all-green, mint-washed look this app started with.

It still explicitly rejects the eco-marketing playbook: no leaf illustrations, no gradient hero blobs, no stock-photo wind turbines, no hopeful-pastel color washes. Green means "this is the Enevo family," not "we care about nature" — the seriousness comes from the same credentials-and-precision register the parent sites use (stats, capacity figures, comparison), not from sustainability iconography.

Colors, shadows, spacing, and the font family live in one shared module (`frontend/src/lib/tokens.ts`), mirrored as CSS custom properties in `index.css` for the elements that need real `:hover`/`:focus-visible` states inline styles can't express. Roboto is installed and wired up; the old `Inter` reference is gone.

The system has since committed harder to "instrument, not brochure": the sidebar is now a dark Charcoal rail (not a light gradient), KPI rows lead with one visually dominant Indigo-Deep hero card instead of four equal cards, and section titles/hero numbers run bigger and bolder. This is amplification within the existing palette — no new hues were introduced — but it pushes further into "premium enterprise data product" territory: strong hierarchy through scale and darkness contrast, generous spacing between sections, and layered shadows on the handful of surfaces that earn elevation.

**Key Characteristics:**
- Forest Green (Enevo's exact `#12541d`) is the primary brand signal; Sentry Teal (`#03bdc2`) is the one sanctioned secondary accent — and now doubles as the "hero number" glow color on dark surfaces (the sidebar clock, the dashboard's dominant KPI, the live-overview strip's renewable-share stat).
- Dark corporate neutrals — Indigo Deep and Charcoal, both lifted from Enevo's own palette — now carry structural chrome (the sidebar) as well as hero moments (the home hero, the dashboard's lead KPI), not just decorative banners.
- Flat at rest for ordinary cards; a small set of hero-weight surfaces (the home hero, the live-overview strip, the dashboard's lead KPI, the comparison table, flip cards) earn a heavier layered shadow via `.card-elevated` to read as premium, not just "a card with a border."
- One dominant number per screen: each major surface leads with a single oversized stat (the hero KPI, the live-overview strip's four-up numbers) before supporting detail — strong hierarchy through scale and position, not decoration.
- Data density over illustration: KPI cards, donut/bar charts, and choropleth fills are the actual content, not supporting decoration.

## 2. Colors

Restrained, corporate-neutral-led palette: one committed green plus one committed teal carry brand and interaction, dark navy/charcoal carries prominent surfaces, and a disciplined categorical set exists purely to encode renewable-source types in charts and the map.

### Primary
- **Forest** (`#12541d`): the brand green, pulled directly from enevogroup.com. Used for the "back to map" pill text, active-state text, and any "this is on-brand and healthy" signal.
- **Forest Mid** (`#1c6b2a`): a lifted mid-green for hover states and icon accents where Forest itself would be too dark to read against a tinted background.
- **Sage Tint** (`#dde9df`): a muted, low-chroma pale background for Forest-colored pills and badges — deliberately less bright than a typical "mint" tint, to read as corporate rather than eco-pastel.

### Secondary
- **Indigo Deep** (`#192168`) → **Steel Navy** (`#22364e`), 135° gradient: the system's dark hero surface — the home-screen hero, the live-overview instrument strip, and the dashboard's lead KPI card (solid Indigo Deep, no gradient, on the smaller surface).
- **Charcoal** (`#32373c`): the second dark neutral, also from Enevo. Originally scoped to small elements (tooltips), it now also carries the sidebar rail — a full-height structural surface, not just an accent — plus anywhere a dark tooltip or footer needs a flatter, less "hero" dark than Indigo Deep.

### Tertiary (data-viz palette)
- **Sentry Teal** (`#03bdc2`): the sibling-brand accent, used for interactive/info UI — links, focus rings, active highlights — never for data encoding. Deliberately distinct in *role* from Hydro Cyan below, even though both sit in the cyan family.
- **Wind Blue** (`#2563eb`), **Solar Amber** (`#f59e0b`): wind and solar capacity, in charts and KPI top-borders only.
- **Hydro Cyan** (`#06b6d4`), **Geothermal Red** (`#ef4444`), **Biomass Green** (`#16a34a`), **Tidal Sky** (`#0ea5e9`): the remaining renewable-source accents, used only on the home screen's energy-type flip cards.
- **Investment Violet** (`#8b5cf6`): reserved for the "share of output" KPI. Notably close to the violet/magenta accents SentryOT itself uses for differentiation in diagrams — a happy reinforcement of the sibling-brand link, not a coincidence to fight.

### Neutral
- **Ink** (`#111827`): primary text, headings.
- **Slate** (`#374151`): secondary text (chart legends).
- **Muted** (`#6b7280`): tertiary text (captions, sub-labels, timestamps).
- **Surface** (`#ffffff`): card and panel background.
- **Mist** (`#f4f6f4`): the app's page background — a near-neutral off-white with only a whisper of green, replacing the previous bright "Mint Mist" (`#f0faf4`). Professional first, on-brand second.
- **Border Sage** (`#dde3de`): the default card and input border — a muted sage-gray rather than the previous bright mint-green border.
- **Zinc scale** (`#fafafa` / `#e4e4e7` / `#a1a1aa` / `#52525b` / `#18181b`): the sidebar's own cooler neutral layer, unchanged — it already read as structural chrome rather than eco-tinted.

### Semantic
- **Error Red** (`#dc2626`) on **Error Bg** (`#fef2f2`) with **Error Border** (`#fecaca`): the only red in the system. Reserved strictly for failed data fetches — never used decoratively.

### Named Rules
**The Two-Accent Rule.** Forest Green (matching Enevo Group) is the brand's primary signal color; Sentry Teal (matching SentryOT) is the sole secondary/interactive accent. Every other hue in the Tertiary set — wind blue, solar amber, hydro cyan, geothermal red, biomass green, tidal sky, investment violet — exists solely to encode a data category and must never be reused for UI chrome, buttons, or navigation.

**The Corporate Darks Rule.** Indigo Deep and Charcoal, both lifted from Enevo's own site, are the only sanctioned dark surfaces. The previous all-green "Deep Pine" gradient and the one-off `navy-legacy` (`#1e3a5f`) used on flip-card fronts are both retired — every dark surface in the app should converge on this one pairing.

## 3. Typography

**Display/Body/Label Font:** Roboto (with system-ui, sans-serif fallback) — matching enevogroup.com exactly, at the same weights it loads (300 / 400 / 500 / 700).

**Character:** One familiar, corporate-neutral sans carries every role, from the 52px hero down to 12px uppercase KPI labels. No display flourish anywhere — hierarchy comes from size, weight, and darkness contrast, matching the parent brand's restraint rather than introducing a distinct "product" voice. The scale runs bigger and bolder than a typical restrained product UI on purpose: this is the "premium enterprise" amplification, expressed through scale and confidence rather than new colors or effects.

### Hierarchy
- **Display** (700, 52px, line-height 1.1, letter-spacing -0.02em): the home-screen hero headline only ("The future of energy is renewable") — Home is the one screen with a brand-forward, larger-than-product-register treatment.
- **Headline** (700, 36px, letter-spacing -0.02em): page-level titles ("Country Dashboard", "Country Comparison", "Europe Map") — bumped up from the original 28px pass for stronger presence against the new dark sidebar and elevated cards.
- **Title** (500, 20px, letter-spacing -0.3px): section headers ("Renewable energy types"). A compact variant at 600/17px covers in-card chart titles ("Solar vs wind mix") — same role, slightly heavier weight for legibility against more generous card padding.
- **Body** (400, 14–15px, line-height 1.6): descriptions, chart legends, form labels. Cap prose at 65–75ch; data-dense contexts (KPI sub-labels) can run tighter.
- **Label** (500, 12px, letter-spacing 0.06em, uppercase): KPI card eyebrow labels ("WIND CAPACITY"), the sidebar's "Navigation" section header. Reserved for short, data-adjacent labels — not for marketing kickers.

### The Hero Number Pattern
Every major screen leads with exactly one oversized numeral before any supporting detail: the dashboard's combined-capacity KPI (52px, Sentry Teal, on Indigo Deep), the live-overview strip's four stats (40px, white or Sentry Teal, on the gradient), the comparison table's rank totals and investment-snapshot percentages (28–32px). These aren't a fixed frontmatter role — they're Display-weight (700) applied at a size chosen for the surface — but the pattern is deliberate and repeats: one dominant number draws the eye before the reader parses labels or supporting stats.

### Named Rules
**The Sibling-Brand Font Rule.** Typography matches Enevo Group's own choice (Roboto) rather than an unrelated product font, reinforcing that this app is part of the same family. Roboto is installed (`@fontsource/roboto`, weights 300/400/500/700, imported in `main.tsx`); `@fontsource-variable/geist` was removed as a dependency once it was clear Roboto was the sibling-brand-aligned choice.

## 4. Elevation

Most surfaces are flat with one soft ambient shadow — never used to fake gloss or glassmorphism. A deliberately small set of hero-weight surfaces earn a heavier, two-layer **Elevated** shadow instead, so "premium" reads as an exception that matters, not a blanket treatment. Clickable cards and rows lift further on hover (Hover Lift, below).

### Shadow Vocabulary
- **Ambient Card** (`box-shadow: 0 2px 8px rgba(0,0,0,0.06)`): the resting shadow for ordinary card-shaped surfaces (secondary KPI cards, section cards, the map container).
- **Ambient Hero** (`box-shadow: 0 4px 20px rgba(0,0,0,0.12)`): mid-weight prominent surfaces that don't rise to full Elevated treatment.
- **Elevated** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 20px 48px rgba(0,0,0,0.14)`): a layered tight-contact + soft-diffuse shadow via the `.card-elevated` class, reserved for the system's hero-weight surfaces — the home hero, the live-overview instrument strip, the dashboard's lead KPI card, flip cards, and the comparison table. This is the one shadow that should feel expensive; don't apply it to routine cards or it stops meaning anything.
- **Rail Edge** (`box-shadow: 6px 0 32px rgba(0,0,0,0.08)`): cast from the dark sidebar onto the light content area, reinforcing it as a distinct structural layer rather than a flush panel.
- **Input Subtle** (`box-shadow: 0 1px 4px rgba(0,0,0,0.06)`): form controls at rest (the country-select dropdown).
- **Tooltip Dark** (`box-shadow: 0 4px 16px rgba(0,0,0,0.3)`): the dark chart-tooltip popover — floats over a chart rather than sitting in the page flow.
- **Hover Lift** (`box-shadow: 0 6px 20px rgba(0,0,0,0.1)`): the hover-elevation shadow for clickable cards/rows (pinned country cards, ranking rows). Pairs with a 2px upward `translateY` on hover, back to Ambient Card on active/press.

### Named Rules
**The Flat-By-Default Rule.** Every surface is flat at rest; Ambient Card is the ceiling for anything embedded in page flow. Only hero-weight surfaces (Elevated) and floating overlays (tooltips) earn a heavier shadow.

**The One Elevated Surface Per Screen Rule.** Within a screen's own content, Elevated marks exactly one dominant surface (the dashboard's lead KPI, the comparison table, the home hero) — never a repeated grid (the flip cards use Ambient Card, not Elevated, for this reason) and never two content cards at equal weight. The persistent live-overview strip is the one exception, since it's cross-screen chrome rather than that screen's content — it and one screen-level Elevated surface can coexist without competing.

## 5. Components

### Buttons / Pills
- **Shape:** 8px radius (`{rounded.sm}`) for pills; segmented controls use 20px outer / 9px inner (see Segmented Control below).
- **Primary pill** ("← Back to map"): Sage Tint background, Forest text, Border Sage 1px border, 7–14px padding.
- **Nav item (sidebar, dark):** no visible button chrome at rest; active state is a solid Sentry Teal fill with white text and icon; inactive is `rgba(255,255,255,0.6)` text, hover fades to `rgba(255,255,255,0.06)` white overlay. Icon-only in collapsed (rail) mode.
- **Hover / Focus:** every button, pill, select, and interactive row/card has a hover and `:focus-visible` state. A single global rule (`:focus-visible { outline: 2px solid var(--sentry-teal) }` in `index.css`) rings every focusable element in Sentry Teal — never Forest — keeping "interactive" and "brand status" visually distinct. Elements whose color varies per-instance (the Pin button, sort toggles) pass their color through CSS custom properties so the shared `.pill-btn` / `.pin-btn` / `.sort-btn` classes can still own hover/active overrides; a plain inline `style.background` would otherwise always beat a class's `:hover` rule.

### Segmented Control
The sort toggle (Total / Wind / Solar on the comparison screen): a Mist-background pill-shaped track (`{rounded.xl}`, 3px padding) holding borderless buttons; the active option gets a white background, a small lift shadow, and Forest text/weight-700 — closer to a native iOS/macOS segmented control than a row of plain toggle buttons. Reach for this over loose `.sort-btn` buttons whenever the options are mutually exclusive and few (2–4).

### Cards / Containers
- **Corner style:** 16–24px radius depending on weight — `{rounded.lg}` (16px) for compact secondary KPI cards, `{rounded.xl}` (20px) for standard section/content cards, `{rounded.2xl}` (24px) for hero-weight surfaces (the hero KPI card, the home hero, the live-overview strip, the comparison table).
- **Background:** Surface white for ordinary cards; Indigo Deep for hero-weight surfaces (the home hero, the dashboard's lead KPI, flip-card fronts).
- **Shadow strategy:** Ambient Card at rest for ordinary cards; Elevated for the one hero-weight surface per screen (see Elevation, and The One Elevated Surface Per Screen Rule). Clickable cards (pinned country cards) use Hover Lift on hover and drop back to Ambient Card on active/press.
- **Border:** 1px Border Sage on every light-surface card; KPI cards add a 3–4px colored top border keyed to their data category (Wind Blue, Solar Amber, Forest Mid, Investment Violet).
- **Internal padding:** generous — 22–28px for standard cards, 32–36px for hero-weight surfaces (`{spacing.xl}`–`{spacing.2xl}`-adjacent), 56–72px for the home hero (`{spacing.3xl}`/`{spacing.4xl}`).
- **Responsive:** KPI and chart grids use `repeat(auto-fit, minmax(_, 1fr))` rather than a fixed column count, so they reflow to 2 or 1 columns on narrow viewports without a breakpoint.

### Hero KPI Card (signature pattern)
The dashboard's KPI row leads with one dominant card — Indigo Deep background, `{rounded.2xl}`, spans 2 grid columns, 52px Sentry-Teal numeral — beside three smaller white secondary KPI cards at the standard 26px numeral size. This asymmetry (one hero + N supporting, not N equal cards) is the system's answer to "strong visual hierarchy": size, color, and position all agree on what matters most before the reader parses any label. Use `gridColumn: "span 2"` inside the same `repeat(auto-fit, minmax(_,1fr))` grid as the supporting cards — it stays responsive without a separate breakpoint.

### Instrument Strip (signature pattern)
The live-overview banner (`EuropeSummary`): a full-width Indigo-Deep→Steel-Navy strip with a small live-status dot + label, then up to four 40px stat numerals separated by vertical hairline dividers (`rgba(255,255,255,0.1)`, not a colored accent — plain neutral dividers between stat groups are a standard pattern, distinct from the banned colored side-stripe). **The dividers only make sense side-by-side**: below 640px the stats wrap to a 2-column layout via `flex-wrap`, and the dividers must disable via a media query (`.stat-strip-item` in `index.css`) rather than staying in inline styles — an inline divider left in place produces a dangling border line once an item wraps to its own row.

### Inputs / Fields
- **Style:** Surface background, Border Sage 1.5px stroke, 10px radius (`{rounded.md}`), Input Subtle shadow. Shared via the `.select-field` class in `index.css`.
- **Focus / Hover:** hover darkens the border toward Forest Soft; focus rings in Sentry Teal via the global `:focus-visible` rule.
- **Error / Disabled:** still undefined — the country-select dropdown has no error or disabled variant yet. Add one before a form with real validation ships.

### Navigation
- **Style:** persistent dark Charcoal rail (not the light gradient of earlier passes) — this is now the single biggest "premium enterprise" signal in the system, matching the left-rail convention of Linear/Vercel/Datadog-class tools. Logo mark: Forest→Forest Mid gradient square with a white leaf icon, on the dark background. Live clock in a subtle `rgba(255,255,255,0.03)` panel with Sentry-Teal tabular-numeral digits. Active nav item is a solid Sentry Teal fill (see Buttons above). The rail casts a Rail Edge shadow onto the light content area so it reads as a distinct structural layer.
- **Responsive:** the sidebar collapses to a 76px icon-only rail below the `lg` breakpoint (labels, clock, hint, and attribution hide; icons and active state stay) rather than a fixed width at every size. Every icon carries a `title` attribute so the label is still available on hover/screen reader in collapsed mode.

### Skeleton Loaders
A shimmer gradient (`linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)`) fills placeholder blocks shaped like the real KPI/chart grid while data loads — used instead of a spinner, per product-register convention. The dashboard skeleton mirrors the Hero KPI Card's asymmetric span so the loading state doesn't jump when real data arrives.

### Flip Card (signature component)
The home screen's energy-type cards: a 3D `rotateY` flip on click, Indigo Deep front face (icon in a soft `rgba(255,255,255,0.06)` circle, not a bare emoji) and a Surface-white back face bordered in the category's Tertiary color, showing a stat badge and a fact list. Uses the standard Ambient Card shadow, not Elevated — see The One Elevated Surface Per Screen Rule; six repeated hero-weight shadows would read as "everything is important," i.e. nothing is. The only place in the system where whimsical motion (a physical card flip) is intentional — everywhere else motion should stay in the Restrained/Responsive range described in PRODUCT.md's calm-confidence principle.

## 6. Do's and Don'ts

### Do:
- **Do** treat Forest (`#12541d`) as the primary brand signal and Sentry Teal (`#03bdc2`) as the only secondary/interactive accent; keep the Tertiary data palette exclusively for chart and category encoding.
- **Do** use the 16px card radius (`{rounded.lg}`) on every card-shaped surface, with no exceptions.
- **Do** keep the map/chart palette colorblind-safe — pair color with icons or text labels the way the KPI cards already do (icon + label + color), never color alone.
- **Do** give every interactive element hover, focus, and (where it applies) active states — the shared classes in `index.css` (`.pill-btn`, `.sort-btn`, `.select-field`, `.card-interactive`, `.row-interactive`, `.icon-btn`, `.pin-btn`) plus the global `:focus-visible` rule are the toolkit; reach for them before writing a new one-off.
- **Do** route per-instance dynamic colors through CSS custom properties (`style={{ '--pin-bg': ... }}`) when the element also needs a class-driven hover/active state — a plain inline `style.background`/`style.border` always wins over a class's `:hover` rule, silently killing the interaction.
- **Do** use `repeat(auto-fit, minmax(_, 1fr))` for card/chart grids instead of a fixed column count, so layouts reflow on narrow viewports without a media query.
- **Do** make every clickable non-button element (a card, a table row) keyboard-operable: `tabIndex={0}`, an `onKeyDown` handler for Enter/Space, and an `aria-label` describing the action.
- **Do** lead each screen's primary content with one dominant surface (the Hero KPI Card, the Elevated table) rather than a row of equal-weight cards — strong hierarchy comes from one clear "most important thing," not from making everything bigger.
- **Do** disable side-by-side-only visual devices (the instrument strip's dividers) via a CSS media query, not inline styles, when the layout can wrap to a single column.

### Don't:
- **Don't** drift back to the bright, all-green "eco app" wash this system started as — Forest is one accent among dark corporate neutrals now, not the dominant hue.
- **Don't** introduce generic green/eco marketing aesthetics: leaf illustrations, gradient hero blobs, or stock nature photography (per PRODUCT.md's anti-references).
- **Don't** use alarm-driven red framing as a default; Error Red is reserved strictly for actual fetch/data failures.
- **Don't** use Sentry Teal for data encoding — it's reserved for interactive/info UI chrome; Hydro Cyan remains the only cyan-family data color, even though the two sit close in hue.
- **Don't** add new one-off dark surfaces. Indigo Deep and Charcoal are the only two; nothing else should be invented.
- **Don't** reference a font family string that isn't an installed dependency.
- **Don't** animate `width`/`height` for progress-style fills — use a fixed-size track with `transform: scaleX(...)` and `transform-origin: left` (the `.progress-fill` class) so the browser skips layout entirely.
- **Don't** nest a real `<button>` inside another `<button>` for "clickable card with an inner action" patterns (e.g. a pinned card with its own unpin control) — invalid HTML, and browsers silently break out of it. Use `role="button"` + `tabIndex` + `onKeyDown` on the outer element instead.
- **Don't** apply the Elevated shadow to a repeated grid (card lists, the flip-card grid) — it's reserved for the one hero-weight surface per screen; spread across many cards it stops reading as premium and just looks heavy.
- **Don't** ship the current placeholder brand assets as final: `favicon.svg` is a generic purple lightning-bolt icon unrelated to the brand (Enevo/SentryOT green-and-navy or teal), and `icons.svg` is leftover Vite-template cruft with no live usage — replace or remove before this is considered launch-ready.
