import { useState } from "react";
import { colors, gradients, shadows } from "@/lib/tokens";

const CARD_FRONT_BG = colors.indigoDeep;
const CARD_FRONT_TEXT = "#ffffff";
const CARD_BACK_BG = colors.mist;
const CARD_BACK_TEXT = colors.ink;
const ACCENT = colors.sentryTeal;

interface EnergyCard {
  id: string;
  title: string;
  emoji: string;
  color: string;
  shortDesc: string;
  facts: string[];
  stat: { value: string; label: string };
}

const CARDS: EnergyCard[] = [
  {
    id: "solar",
    title: "Solar energy",
    emoji: "☀️",
    color: colors.solarAmber,
    shortDesc: "Capturing sunlight to generate electricity",
    facts: [
      "Photovoltaic panels convert sunlight directly into electricity.",
      "The Sun delivers more energy in one hour than humanity uses in a year.",
      "Solar is now the cheapest source of electricity in history.",
      "Panels last 25–30 years with minimal maintenance.",
    ],
    stat: { value: "1,000 GW+", label: "Global installed capacity (2023)" },
  },
  {
    id: "wind",
    title: "Wind energy",
    emoji: "💨",
    color: colors.windBlue,
    shortDesc: "Harnessing the power of moving air",
    facts: [
      "Wind turbines can operate onshore and offshore.",
      "A single modern turbine can power over 1,000 homes.",
      "Europe leads globally in offshore wind development.",
      "No greenhouse gases are produced during operation.",
    ],
    stat: { value: "2,100 GW+", label: "Global installed capacity (2023)" },
  },
  {
    id: "hydro",
    title: "Hydroelectric energy",
    emoji: "💧",
    color: colors.hydroCyan,
    shortDesc: "Generating power from flowing water",
    facts: [
      "Hydropower is the largest renewable electricity source worldwide.",
      "Dams also serve as water storage and flood control.",
      "Run-of-river plants have a minimal environmental footprint.",
      "Pumped-storage hydro acts as a giant rechargeable battery.",
    ],
    stat: { value: "~16%", label: "Share of global electricity (2023)" },
  },
  {
    id: "geothermal",
    title: "Geothermal energy",
    emoji: "🌋",
    color: colors.geothermalRed,
    shortDesc: "Using Earth's internal heat",
    facts: [
      "Geothermal plants emit very little CO₂.",
      "Available 24/7 — not dependent on weather.",
      "Iceland meets over 66% of its energy from geothermal.",
      "Suitable for electricity generation and direct heating.",
    ],
    stat: { value: "~15 GW", label: "Global installed capacity (2023)" },
  },
  {
    id: "biomass",
    title: "Biomass energy",
    emoji: "🌿",
    color: colors.biomassGreen,
    shortDesc: "Energy from organic biological materials",
    facts: [
      "Biomass includes wood, crop waste, and organic waste.",
      "Can be converted into electricity, heat, or biofuels.",
      "Carbon-neutral when sustainably managed.",
      "Provides reliable baseload power unlike solar or wind.",
    ],
    stat: { value: "~130 GW", label: "Global installed capacity (2023)" },
  },
  {
    id: "tidal",
    title: "Tidal and marine energy",
    emoji: "🌊",
    color: colors.tidalSky,
    shortDesc: "Power from ocean tides and waves",
    facts: [
      "Tidal energy is highly predictable — follows lunar cycles.",
      "Marine energy has enormous untapped global potential.",
      "Wave energy converters can be deployed offshore.",
      "Costs are falling as the technology matures.",
    ],
    stat: { value: "~0.5 GW", label: "Global installed capacity (2023)" },
  },
];

function FlipCard({ card }: { card: EnergyCard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={flipped ? `${card.title} facts — press to flip back` : `${card.title}: ${card.shortDesc} — press to see facts`}
      style={{
        display: "block", width: "100%", padding: 0, margin: 0, border: "none",
        background: "none", font: "inherit", textAlign: "inherit",
        perspective: 1200, cursor: "pointer", height: 236,
      }}
    >
      <div
        className="flip-card-inner"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT */}
        <div
          style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: CARD_FRONT_BG,
            borderRadius: 20,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, padding: "20px 24px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: shadows.ambientCard,
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>
            {card.emoji}
          </div>
          <p style={{
            fontSize: 17, fontWeight: 700, color: CARD_FRONT_TEXT,
            textAlign: "center", letterSpacing: "-0.2px", margin: 0,
          }}>
            {card.title}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center", margin: 0, maxWidth: "80%" }}>
            {card.shortDesc}
          </p>
          <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
            Tap to learn more →
          </div>
        </div>

        {/* BACK */}
        <div
          style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: CARD_BACK_BG,
            borderRadius: 20,
            padding: "18px 20px",
            border: `2px solid ${card.color}`,
            display: "flex", flexDirection: "column", gap: 10,
            overflow: "hidden",
            boxShadow: shadows.ambientCard,
          }}
        >
          {/* Stat badge */}
          <div style={{
            background: card.color, borderRadius: 10, padding: "8px 12px",
            display: "inline-flex", flexDirection: "column", width: "fit-content", flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{card.stat.value}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", lineHeight: 1.2 }}>{card.stat.label}</span>
          </div>

          {/* Facts */}
          <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {card.facts.map((fact, i) => (
              <li key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                fontSize: 12, color: CARD_BACK_TEXT, lineHeight: 1.4,
              }}>
                <span style={{ color: card.color, flexShrink: 0, fontWeight: 700 }}>✓</span>
                {fact}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: "auto", fontSize: 10, color: colors.muted, textAlign: "right" }}>
            Tap to flip back
          </div>
        </div>
      </div>
    </button>
  );
}

export function HomeScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Hero */}
      <div className="card-elevated" style={{
        background: gradients.heroDark,
        borderRadius: 28, padding: "64px 64px",
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(3,189,194,0.15)", borderRadius: 20,
            padding: "6px 16px", marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, display: "inline-block" }} />
            <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>Renewable Investment Advisor</span>
          </div>
          <h1 style={{
            fontSize: 52, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 20,
          }}>
            The future of energy is renewable
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, maxWidth: "56ch" }}>
            Explore the six main types of renewable energy powering Europe's clean transition.
            Click any card to discover key facts and investment potential.
          </p>
        </div>
      </div>

      {/* Section title */}
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: colors.ink, letterSpacing: "-0.02em" }}>
          Renewable energy types
        </h2>
        <p style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
          Click a card to flip it and learn more
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
      }}>
        {CARDS.map((card) => (
          <FlipCard key={card.id} card={card} />
        ))}
      </div>

      <p style={{ fontSize: 11, textAlign: "center", color: colors.muted, marginTop: 8 }}>
        Data: Energy-Charts.info (CC BY 4.0) · Global capacity figures from IRENA 2023
      </p>
    </div>
  );
}