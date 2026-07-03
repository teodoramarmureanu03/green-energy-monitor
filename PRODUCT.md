# Product

## Register

product

## Users

Primary: investors and analysts comparing renewable-energy capacity and output across European countries to inform investment or research decisions — they need accurate, comparable, quickly-scannable data more than they need to be sold a story.

Secondary: curious general users and students exploring how much renewable energy Europe produces, mostly via the home screen's explainer content before they drop into the map/dashboard.

## Product Purpose

An EU renewable-energy monitor ("Renewable Investment Advisor") that lets users explore and compare solar, wind, hydro, geothermal, biomass, and tidal generation per European country, backed by live data (ENTSO-E) and reference data (IRENA 2023). Success looks like a user landing on a country via the map or comparison view and walking away with a clear, trustworthy read on that country's renewable capacity and output relative to others — fast enough to inform a real decision, not just browse.

## Brand Personality

Clear, credible, grounded. This is a data-forward analytics tool, not a climate-advocacy site — the tone is calm and precise (Stripe/Linear-grade seriousness) applied to energy data, not hopeful eco-editorial warmth or alarmist urgency. Green is the domain's color, not the brand's whole personality; the interface should feel like a serious instrument first.

**Visual references:**
- **[enevogroup.com](https://enevogroup.com)** — the parent group's energy/EPC site. Corporate, credentials-forward (project counts, countries, turnover stats), grid-based layout with industrial infrastructure photography, Roboto sans throughout. Palette runs deep forest green (`#12541D`) paired with dark navy/indigo (`#192168`, `#22364e`) and charcoal (`#32373c`) on white — green reads as one accent among dark corporate neutrals, not as the dominant hue.
- **[sentryot.com](https://sentryot.com)** — the sibling industrial-cybersecurity product. Enterprise-grade, technically precise tone (compliance, case studies, platform architecture). Its primary accent is a teal/cyan (`#03BDC2`, `#0C6C6F`, `#009EA2`) rather than green, set against dark neutrals, with sparing use of a magenta/violet accent for differentiation in diagrams.
- **What to take from both:** the credibility register (stats, precision, enterprise trust) and the discipline of pairing one saturated accent with dark corporate neutrals rather than a light all-green wash. This app should feel like a sibling product to these two — same seriousness, same restraint — not like a standalone consumer eco-app. Concretely: pull the palette direction (deep green + navy/charcoal, or a teal accent option) and typographic restraint (Roboto-like geometric sans) into DESIGN.md rather than inventing an unrelated green-forward identity.

## Anti-references

- Generic "green/eco" marketing aesthetics: leaf illustrations, gradient hero blobs, stock-photo nature imagery, hopeful-pastel color washes.
- Climate-urgency / alarm-driven framing (doom stats, red-heavy warning treatments as the default state).
- Flat SaaS-cream boilerplate (warm off-white body backgrounds, generic card grids, eyebrow labels above every section).
- Low-contrast pastel-green-on-white text, which the current mock screens already lean toward and should be corrected, not extended.

## Design Principles

- **Data legible over decorative.** The map, charts, and KPI cards are the product; anything ornamental yields to clarity and precision.
- **One system, many screens.** Dashboard, comparison, and map currently duplicate color constants and card styles per-file — consolidate into shared tokens/components so "a KPI card" looks and behaves identically everywhere.
- **Colorblind-safe, map-first.** The core interaction is a choropleth map plus charts; the palette must remain distinguishable under common color-vision deficiencies and encode magnitude, not just category.
- **Show the numbers, not just the story.** The home screen may educate, but product screens (map, dashboard, comparison) foreground real data over illustration.
- **Calm confidence over urgency.** Even where a country lags on renewables, the framing stays analytical and informative rather than alarmist.

## Accessibility & Inclusion

WCAG 2.1 AA minimum. Colorblind-safe data-visualization palette across map, charts, and KPI accents (avoid red/green as the only differentiator). Full `prefers-reduced-motion` support for any chart/map transitions.
