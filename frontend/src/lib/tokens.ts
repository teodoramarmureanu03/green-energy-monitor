// Design tokens — see DESIGN.md. Every value below resolves to a CSS custom
// property defined in index.css, so components stay theme-aware without any
// per-component light/dark branching. The actual light/dark hex values live
// in index.css's :root and :root[data-theme="dark"] blocks — this file only
// names the roles.

export const colors = {
  // Primary — brand green (Enevo). Adaptive: also drives the map's sequential scale.
  forest: "var(--forest)",
  forestMid: "var(--forest-mid)",
  forestSoft: "var(--forest-soft)",
  forestPale: "var(--forest-pale)",
  sageTint: "var(--sage-tint)",
  noData: "var(--no-data)",

  // Secondary — dark corporate surfaces (Enevo). Invariant across themes.
  indigoDeep: "var(--indigo-deep)",
  steelNavy: "var(--steel-navy)",
  charcoal: "var(--charcoal)",

  // Interactive accent (SentryOT). Invariant across themes.
  sentryTeal: "var(--sentry-teal)",

  // Neutral. Adaptive.
  surface: "var(--surface)",
  ink: "var(--ink)",
  slate: "var(--slate)",
  muted: "var(--muted)",
  mist: "var(--mist)",
  borderSage: "var(--border-sage)",
  trackBg: "var(--track-bg)",
  chipBg: "var(--chip-bg)",
  hoverGray: "var(--hover-gray)",
  barHoverWash: "var(--bar-hover-wash)",
  rowHoverWash: "var(--row-hover-wash)",

  // Tertiary — data-viz categories (unchanged in role; never used for chrome). Adaptive.
  windBlue: "var(--wind-blue)",
  solarAmber: "var(--solar-amber)",
  hydroCyan: "var(--hydro-cyan)",
  geothermalRed: "var(--geothermal-red)",
  biomassGreen: "var(--biomass-green)",
  tidalSky: "var(--tidal-sky)",
  investmentViolet: "var(--investment-violet)",
  kpiShare: "var(--kpi-share)",
  iconBgWind: "var(--icon-bg-wind)",
  iconBgSolar: "var(--icon-bg-solar)",
  iconBgShare: "var(--icon-bg-share)",

  // Rank medals (comparison table). Adaptive.
  rankGoldText: "var(--rank-gold-text)",
  rankBronzeText: "var(--rank-bronze-text)",
  rankAmberBg: "var(--rank-amber-bg)",

  // Map chrome — non-data-encoding pixels (borders, hover, no-data fill, labels). Adaptive.
  mapStroke: "var(--map-stroke)",
  mapHoverFill: "var(--map-hover-fill)",
  mapHoverActiveFill: "var(--map-hover-active-fill)",
  mapHoverStroke: "var(--map-hover-stroke)",
  mapLabelFill: "var(--map-label-fill)",
  mapLabelStroke: "var(--map-label-stroke)",

  // Home-screen flip-tile colors — already dark surfaces, invariant across themes.
  tileSolar: "var(--tile-solar)",
  tileWind: "var(--tile-wind)",
  tileHydro: "var(--tile-hydro)",
  tileGeothermal: "var(--tile-geothermal)",
  tileBiomass: "var(--tile-biomass)",
  tileTidal: "var(--tile-tidal)",

  // Sidebar-only text tints — already tuned for a dark rail, invariant across themes.
  sidebarText1: "var(--sidebar-text-1)",
  sidebarText2: "var(--sidebar-text-2)",
  sidebarText3: "var(--sidebar-text-3)",
  sidebarText4: "var(--sidebar-text-4)",
  sidebarHintText: "var(--sidebar-hint-text)",
  sidebarActiveText: "var(--sidebar-active-text)",
  sidebarLiveDot: "var(--sidebar-live-dot)",

  // Semantic. Adaptive.
  errorRed: "var(--error-red)",
  errorBg: "var(--error-bg)",
  errorBorder: "var(--error-border)",
} as const;

export const gradients = {
  heroDark: `linear-gradient(135deg, ${colors.indigoDeep}, ${colors.steelNavy})`,
  sidebar: `linear-gradient(180deg, var(--sidebar-from), var(--sidebar-to))`,
} as const;

export const skeletonGradient = `linear-gradient(90deg, var(--skeleton-a) 25%, var(--skeleton-b) 50%, var(--skeleton-a) 75%)`;

export const shadows = {
  ambientCard: "0 2px 8px rgba(0,0,0,0.06)",
  ambientHero: "0 4px 20px rgba(0,0,0,0.12)",
  inputSubtle: "0 1px 4px rgba(0,0,0,0.06)",
  tooltipDark: "0 4px 16px rgba(0,0,0,0.3)",
  hoverLift: "0 6px 20px rgba(0,0,0,0.1)",
  /** Layered shadow (tight contact + soft diffuse) for premium, elevated hero surfaces. */
  elevated: "0 1px 2px rgba(0,0,0,0.04), 0 20px 48px rgba(0,0,0,0.14)",
  /** Cast from the dark sidebar rail onto the light content area. */
  railEdge: "6px 0 32px rgba(0,0,0,0.08)",
} as const;

/** Generous section rhythm — see layout.md: tight within groups, wide between them. */
export const spacing = {
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "40px",
  "3xl": "56px",
  "4xl": "72px",
} as const;

export const rounded = {
  sm: "8px",
  md: "10px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  full: "9999px",
} as const;

export const fontFamily = "Roboto, system-ui, sans-serif";

/** Sequential ramp for the choropleth map, from no-data to Forest at 70%+. */
export function shareToColor(pct: number): string {
  if (pct >= 65) return colors.forest;
  if (pct >= 40) return colors.forestMid;
  if (pct >= 25) return colors.forestSoft;
  if (pct >= 0) return colors.forestPale;
  return colors.noData;
}
