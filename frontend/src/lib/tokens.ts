// Design tokens — see DESIGN.md. Colors and typography are pulled from the
// Enevo Group / SentryOT parent-brand identity, not chosen per-screen.

export const colors = {
  // Primary — brand green (Enevo)
  forest: "#12541d",
  forestMid: "#1c6b2a",
  forestSoft: "#4d9d55",
  forestPale: "#a3cca7",
  sageTint: "#dde9df",

  // Secondary — dark corporate surfaces (Enevo)
  indigoDeep: "#192168",
  steelNavy: "#22364e",
  charcoal: "#32373c",

  // Interactive accent (SentryOT)
  sentryTeal: "#03bdc2",

  // Neutral
  surface: "#ffffff",
  ink: "#111827",
  slate: "#374151",
  muted: "#6b7280",
  mist: "#f4f6f4",
  borderSage: "#dde3de",

  // Tertiary — data-viz categories (unchanged; never used for chrome)
  windBlue: "#2563eb",
  solarAmber: "#f59e0b",
  hydroCyan: "#06b6d4",
  geothermalRed: "#ef4444",
  biomassGreen: "#16a34a",
  tidalSky: "#0ea5e9",
  investmentViolet: "#8b5cf6",

  // Semantic
  errorRed: "#dc2626",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
} as const;

export const gradients = {
  heroDark: `linear-gradient(135deg, ${colors.indigoDeep}, ${colors.steelNavy})`,
} as const;

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
  if (pct >= 70) return colors.forest;
  if (pct >= 55) return colors.forestMid;
  if (pct >= 40) return colors.forestSoft;
  if (pct >= 25) return colors.forestPale;
  return "#e4e4e7";
}
