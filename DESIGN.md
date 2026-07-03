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
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.5px"
  headline:
    fontFamily: "Roboto, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.5px"
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
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
components:
  kpi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "22px 24px"
  section-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  nav-item-active:
    backgroundColor: "{colors.zinc-900}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.zinc-600}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
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
---

# Design System: EU Renewables Monitor

## 1. Overview

**Creative North Star: "The Grid Readout"**

This is an instrument, not a brochure — and it now reads as a sibling product to its parent brands rather than a standalone consumer eco-app. [enevogroup.com](https://enevogroup.com) and [sentryot.com](https://sentryot.com) set the identity: corporate, credentials-forward, dark-neutral-led, with green (Enevo) or teal (SentryOT) as one disciplined accent rather than the dominant hue. This system pulls Forest Green directly from Enevo's palette, adds SentryOT's teal as the second brand-level accent, and pairs both against Indigo Deep and Charcoal — Enevo's own dark neutrals — instead of the all-green, mint-washed look this app started with.

It still explicitly rejects the eco-marketing playbook: no leaf illustrations, no gradient hero blobs, no stock-photo wind turbines, no hopeful-pastel color washes. Green means "this is the Enevo family," not "we care about nature" — the seriousness comes from the same credentials-and-precision register the parent sites use (stats, capacity figures, comparison), not from sustainability iconography.

The system is still young: colors and type sizes are currently duplicated as local constants across four different screen files rather than shared tokens, and the previously-declared body font (`Inter`) was never installed. This document captures the target system post-realignment; migrating the actual component code to it is the next step.

**Key Characteristics:**
- Forest Green (Enevo's exact `#12541d`) is the primary brand signal; Sentry Teal (`#03bdc2`) is the one sanctioned secondary accent, borrowed directly from the sibling product.
- Dark corporate neutrals — Indigo Deep and Charcoal, both lifted from Enevo's own palette — replace the old all-green hero gradient as the system's dark surface.
- Flat at rest; the only elevation is a soft ambient shadow under cards, never a floating/glassy effect.
- Data density over illustration: KPI cards, donut/bar charts, and choropleth fills are the actual content, not supporting decoration.

## 2. Colors

Restrained, corporate-neutral-led palette: one committed green plus one committed teal carry brand and interaction, dark navy/charcoal carries prominent surfaces, and a disciplined categorical set exists purely to encode renewable-source types in charts and the map.

### Primary
- **Forest** (`#12541d`): the brand green, pulled directly from enevogroup.com. Used for the "back to map" pill text, active-state text, and any "this is on-brand and healthy" signal.
- **Forest Mid** (`#1c6b2a`): a lifted mid-green for hover states and icon accents where Forest itself would be too dark to read against a tinted background.
- **Sage Tint** (`#dde9df`): a muted, low-chroma pale background for Forest-colored pills and badges — deliberately less bright than a typical "mint" tint, to read as corporate rather than eco-pastel.

### Secondary
- **Indigo Deep** (`#192168`) → **Steel Navy** (`#22364e`), 135° gradient: the system's dark surface, replacing the old all-green "Deep Pine" hero. Both values are lifted directly from Enevo's own site. Reserved for the home-screen hero banner and any other screen-level dark surface.
- **Charcoal** (`#32373c`): a secondary dark neutral, also from Enevo, for smaller dark UI elements (e.g. a dark tooltip or footer) where the full Indigo/Navy gradient would be too heavy.

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

**Character:** One familiar, corporate-neutral sans carries every role, from the 36px hero headline down to 12px uppercase KPI labels. No display flourish anywhere — hierarchy comes from size and weight, matching the parent brand's restraint rather than introducing a distinct "product" voice.

### Hierarchy
- **Display** (700, 36px, line-height 1.2, letter-spacing -0.5px): the home-screen hero headline only ("The future of energy is renewable").
- **Headline** (700, 28px, letter-spacing -0.5px): page-level titles ("Country Dashboard", "Europe Map").
- **Title** (500, 20px, letter-spacing -0.3px): section headers ("Renewable energy types"). A compact variant at 500/15px covers in-card titles ("Solar vs wind mix") — same role, denser context.
- **Body** (400, 14px, line-height 1.6): descriptions, chart legends, form labels. Cap prose at 65–75ch; data-dense contexts (KPI sub-labels) can run tighter.
- **Label** (500, 12px, letter-spacing 0.06em, uppercase): KPI card eyebrow labels ("WIND CAPACITY"), the sidebar's "Navigation" section header. Reserved for short, data-adjacent labels — not for marketing kickers.

### Named Rules
**The Sibling-Brand Font Rule.** Typography now matches Enevo Group's own choice (Roboto) rather than an unrelated product font, reinforcing that this app is part of the same family. Roboto is **not yet installed** in `frontend/`; add it (`@fontsource/roboto` with weights 300/400/500/700, or the same Google Fonts `<link>` Enevo uses) and remove the currently-uninstalled `Inter` reference in `App.tsx`. This supersedes the earlier recommendation to adopt the already-installed-but-unused `@fontsource-variable/geist` — explicit sibling-brand alignment now wins over "what's already a dependency."

## 4. Elevation

The system is flat by default with one soft ambient shadow reserved for raised content — never used to fake gloss or glassmorphism. There is no defined hover-elevation state anywhere yet: cards do not currently lift or deepen their shadow on hover.

### Shadow Vocabulary
- **Ambient Card** (`box-shadow: 0 2px 8px rgba(0,0,0,0.06)`): the resting shadow for every card-shaped surface (KPI cards, section cards, the map container).
- **Ambient Hero** (`box-shadow: 0 4px 20px rgba(0,0,0,0.12)`): the home-screen hero banner (now on the Indigo Deep → Steel Navy gradient) and any similarly prominent, full-width surface.
- **Input Subtle** (`box-shadow: 0 1px 4px rgba(0,0,0,0.06)`): form controls at rest (the country-select dropdown).
- **Tooltip Dark** (`box-shadow: 0 4px 16px rgba(0,0,0,0.3)`): the dark chart-tooltip popover — the one place a heavier shadow is justified, since the tooltip floats over a chart rather than sitting in the page flow.

### Named Rules
**The Flat-By-Default Rule.** Every surface is flat at rest; Ambient Card is the ceiling for anything embedded in page flow. Only floating overlays (tooltips) earn a heavier shadow.

## 5. Components

### Buttons / Pills
- **Shape:** 8px radius (`{rounded.sm}`).
- **Primary pill** ("← Back to map"): Sage Tint background, Forest text, Border Sage 1px border, 7–14px padding.
- **Nav item (sidebar):** no visible button chrome at rest; active state is a solid Zinc-900 fill with white text and a Sentry Teal–tinted icon (replacing the old Meadow-green icon tint); inactive is transparent with Zinc-600 text, hover fades to Zinc-100.
- **Hover / Focus:** only the sidebar nav item currently defines a hover treatment. Buttons elsewhere have no documented hover/focus/disabled state — flagged in Do's and Don'ts as a gap to close before shipping. New focus rings across the system should use Sentry Teal, not Forest, to keep "interactive" and "brand status" visually distinct.

### Cards / Containers
- **Corner style:** 16px radius (`{rounded.lg}`), uniform across KPI cards, section cards, the map container, and flip cards.
- **Background:** Surface white, except flip-card fronts (migrate to Indigo Deep, replacing `navy-legacy`) and the home hero (Indigo Deep → Steel Navy gradient).
- **Shadow strategy:** Ambient Card at rest (see Elevation). No hover state defined yet.
- **Border:** 1px Border Sage on every light-surface card; KPI cards add a 4px colored top border keyed to their data category (Wind Blue, Solar Amber, Forest Mid, Investment Violet).
- **Internal padding:** 22–24px (`{spacing.lg}`-adjacent).

### Inputs / Fields
- **Style:** Surface background, Border Sage 1.5px stroke, 10px radius (`{rounded.md}`), Input Subtle shadow.
- **Focus / Error / Disabled:** not yet defined anywhere in the codebase — the country-select dropdown only has a default state. When added, focus should ring in Sentry Teal per the Buttons note above.

### Navigation
- **Style:** persistent 260px left sidebar, Zinc-50→white vertical gradient background, Zinc-200 right border. Logo mark: Forest→Forest Mid gradient square with a white leaf icon (retire the old green-500→emerald-600 Tailwind default in favor of the real Forest tokens). Live clock in a bordered Surface panel using tabular numerals. Nav items per Buttons above. Section label ("Navigation") uses the Label type role in Zinc-400.
- **Mobile treatment:** none defined yet — the sidebar is fixed-width with no collapse/drawer behavior. Worth designing before this ships to smaller viewports.

### Skeleton Loaders
A shimmer gradient (`linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)`) fills placeholder blocks shaped like the real KPI/chart grid while data loads — used instead of a spinner, per product-register convention. Unaffected by this palette shift; it's already neutral gray.

### Flip Card (signature component)
The home screen's energy-type cards: a 3D `rotateY` flip on click, front face now Indigo Deep (migrated from `navy-legacy`) with the type's emoji + name, and a Surface-white back face bordered in the category's Tertiary color, showing a stat badge and a fact list. The only place in the system where whimsical motion (a physical card flip) is intentional — everywhere else motion should stay in the Restrained/Responsive range described in PRODUCT.md's calm-confidence principle.

## 6. Do's and Don'ts

### Do:
- **Do** treat Forest (`#12541d`) as the primary brand signal and Sentry Teal (`#03bdc2`) as the only secondary/interactive accent; keep the Tertiary data palette exclusively for chart and category encoding.
- **Do** use the 16px card radius (`{rounded.lg}`) on every card-shaped surface, with no exceptions.
- **Do** keep the map/chart palette colorblind-safe — pair color with icons or text labels the way the KPI cards already do (icon + label + color), never color alone.
- **Do** install Roboto (`@fontsource/roboto`, weights 300/400/500/700, or Enevo's own Google Fonts link) to match the parent-brand typography, and remove the uninstalled `Inter` reference in `App.tsx`.
- **Do** migrate the home hero and flip-card fronts from the retired green gradient / `navy-legacy` to the Indigo Deep → Steel Navy pairing.
- **Do** consolidate the color and type constants currently duplicated as local `const` blocks in `DashboardScreen.tsx`, `ComparisonScreen.tsx`, `EuropeSummary.tsx`, and `HomeScreen.tsx` into one shared tokens module built on these new values.
- **Do** define hover/focus/disabled states for buttons and inputs before adding more of either — right now most only have a default state.

### Don't:
- **Don't** drift back to the bright, all-green "eco app" wash this system started as — Forest is one accent among dark corporate neutrals now, not the dominant hue.
- **Don't** introduce generic green/eco marketing aesthetics: leaf illustrations, gradient hero blobs, or stock nature photography (per PRODUCT.md's anti-references).
- **Don't** use alarm-driven red framing as a default; Error Red is reserved strictly for actual fetch/data failures.
- **Don't** use Sentry Teal for data encoding — it's reserved for interactive/info UI chrome; Hydro Cyan remains the only cyan-family data color, even though the two sit close in hue.
- **Don't** add new one-off dark surfaces. Indigo Deep and Charcoal are the only two; nothing else should be invented.
- **Don't** reference a font family string that isn't an installed dependency.
- **Don't** ship the current placeholder brand assets as final: `favicon.svg` is a generic purple lightning-bolt icon unrelated to the brand (Enevo/SentryOT green-and-navy or teal), and `icons.svg` plus `App.css` are leftover Vite-template cruft with no live usage — replace or remove before this is considered launch-ready.
