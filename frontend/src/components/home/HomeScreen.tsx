// src/components/home/HomeScreen.tsx
import { useState } from "react";

interface EnergyType {
  id: string;
  title: string;
  photoUrl: string;
  tileColor: string;
  accentColor: string;
  facts: string[];
  stat: { value: string; label: string };
}

const TYPES: EnergyType[] = [
  {
    id: "solar",
    title: "Solar Energy",
    photoUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
    tileColor: "#1e3a5f",
    accentColor: "#03bdc2",
    facts: [
      "Panels convert sunlight directly into electricity.",
      "Solar is now the cheapest electricity source in history.",
      "Panels last 25–30 years with minimal maintenance.",
    ],
    stat: { value: "1,000 GW+", label: "Global capacity (2023)" },
  },
  {
    id: "wind",
    title: "Wind Energy",
    photoUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80",
    tileColor: "#22364e",
    accentColor: "#03bdc2",
    facts: [
      "Turbines can operate onshore and offshore.",
      "One modern turbine can power 1,000+ homes.",
      "No greenhouse gases during operation.",
    ],
    stat: { value: "2,100 GW+", label: "Global capacity (2023)" },
  },
  {
    id: "hydro",
    title: "Hydroelectric Energy",
    photoUrl: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&q=80",
    tileColor: "#1a3a4a",
    accentColor: "#03bdc2",
    facts: [
      "Largest renewable electricity source worldwide.",
      "Dams serve as water storage and flood control.",
      "Pumped-storage acts as a giant rechargeable battery.",
    ],
    stat: { value: "~16%", label: "Share of global electricity" },
  },
  {
    id: "geothermal",
    title: "Geothermal Energy",
    photoUrl: "https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=600&q=80",
    tileColor: "#192168",
    accentColor: "#03bdc2",
    facts: [
      "Available 24/7 — unaffected by weather.",
      "Iceland meets 66%+ of its energy needs geothermally.",
      "Used for both electricity and direct heating.",
    ],
    stat: { value: "~15 GW", label: "Global capacity (2023)" },
  },
  {
    id: "biomass",
    title: "Biomass Energy",
    photoUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    tileColor: "#12541d",
    accentColor: "#03bdc2",
    facts: [
      "Includes wood, crop waste, and organic materials.",
      "Carbon-neutral when sustainably managed.",
      "Provides reliable baseload power year-round.",
    ],
    stat: { value: "~130 GW", label: "Global capacity (2023)" },
  },
  {
    id: "tidal",
    title: "Tidal & Marine Energy",
    photoUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80",
    tileColor: "#0a3d5c",
    accentColor: "#03bdc2",
    facts: [
      "Highly predictable — follows lunar cycles.",
      "Enormous untapped global potential.",
      "Costs falling rapidly as technology matures.",
    ],
    stat: { value: "~0.5 GW", label: "Global capacity (2023)" },
  },
];

function PhotoTile({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        width: "100%", height: "100%",
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      role="img"
      aria-label={alt}
    />
  );
}

function TextTileFront({ type }: { type: EnergyType }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: type.tileColor,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px 24px", gap: 12,
    }}>
      <p style={{
        fontSize: 19, fontWeight: 800, color: "#ffffff",
        textTransform: "uppercase", letterSpacing: "0.12em",
        textAlign: "center", lineHeight: 1.4, margin: 0,
      }}>
        {type.title}
      </p>
      <span style={{
        fontSize: 11, color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.04em",
      }}>
        Click to learn more →
      </span>
    </div>
  );
}

function InfoTile({ type }: { type: EnergyType }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: type.tileColor,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 10,
      boxSizing: "border-box",
    }}>
      {/* Stat badge */}
      <div style={{
        background: type.accentColor,
        borderRadius: 7, padding: "6px 12px",
        display: "inline-flex", flexDirection: "column",
        width: "fit-content", flexShrink: 0,
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          {type.stat.value}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", lineHeight: 1.3 }}>
          {type.stat.label}
        </span>
      </div>

      {/* Facts — 3 short lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        {type.facts.map((fact, i) => (
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <span style={{ color: type.accentColor, fontWeight: 700, fontSize: 13, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", lineHeight: 1.45 }}>{fact}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textAlign: "right", margin: 0 }}>
        Click to flip back
      </p>
    </div>
  );
}

function FlipTile({ type }: { type: EnergyType }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{ cursor: "pointer", perspective: 1000, width: "100%", height: "100%" }}
    >
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <TextTileFront type={type} />
        </div>
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}>
          <InfoTile type={type} />
        </div>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const cells = [
    { kind: "photo" as const, type: TYPES[0] },
    { kind: "text"  as const, type: TYPES[0] },
    { kind: "photo" as const, type: TYPES[1] },
    { kind: "text"  as const, type: TYPES[1] },
    { kind: "text"  as const, type: TYPES[2] },
    { kind: "photo" as const, type: TYPES[2] },
    { kind: "text"  as const, type: TYPES[3] },
    { kind: "photo" as const, type: TYPES[3] },
    { kind: "photo" as const, type: TYPES[4] },
    { kind: "text"  as const, type: TYPES[4] },
    { kind: "photo" as const, type: TYPES[5] },
    { kind: "text"  as const, type: TYPES[5] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #192168 0%, #22364e 100%)",
        borderRadius: 20, padding: "40px 48px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}>
        <div style={{ maxWidth: 600 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(3,189,194,0.15)", borderRadius: 20,
            padding: "4px 14px", marginBottom: 16,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#03bdc2", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#03bdc2", fontWeight: 600 }}>Renewable Investment Advisor</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 12 }}>
            The future of energy is renewable
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
            Explore the six main types of renewable energy powering Europe's clean transition.
            Click any tile to discover key facts and investment potential.
          </p>
        </div>
      </div>

      {/* Section title */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>
          Renewable energy types
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          Click a coloured tile to learn more · navigate to the map to explore country data
        </p>
      </div>

      {/* Mosaic grid — taller rows so info fits */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(3, 260px)",
        gap: 0,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
      }}>
        {cells.map((cell, i) => (
          <div key={i} style={{ width: "100%", height: "100%" }}>
            {cell.kind === "photo"
              ? <PhotoTile src={cell.type.photoUrl} alt={cell.type.title} />
              : <FlipTile type={cell.type} />
            }
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, textAlign: "center", color: "#9ca3af", marginTop: 4 }}>
        Global capacity figures from IRENA 2023 · Photos: Unsplash
      </p>
    </div>
  );
}
