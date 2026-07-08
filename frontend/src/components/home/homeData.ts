import { colors } from "@/lib/tokens";

export interface EnergyType {
  id: string;
  title: string;
  photoUrl: string;
  tileColor: string;
  accentColor: string;
  facts: string[];
  stat: {
    value: string;
    label: string;
  };
}

export type HomeCellKind = "photo" | "text";

export interface HomeCell {
  kind: HomeCellKind;
  type: EnergyType;
}

export const ENERGY_TYPES: EnergyType[] = [
  {
    id: "solar",
    title: "Solar Energy",
    photoUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80",
    tileColor: colors.tileSolar,
    accentColor: colors.sentryTeal,
    facts: [
      "Panels convert sunlight directly into electricity.",
      "Solar is now the cheapest electricity source in history.",
      "Panels last 25–30 years with minimal maintenance.",
    ],
    stat: {
      value: "1,000 GW+",
      label: "Global capacity (2023)",
    },
  },
  {
    id: "wind",
    title: "Wind Energy",
    photoUrl:
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80",
    tileColor: colors.tileWind,
    accentColor: colors.sentryTeal,
    facts: [
      "Turbines can operate onshore and offshore.",
      "One modern turbine can power 1,000+ homes.",
      "No greenhouse gases during operation.",
    ],
    stat: {
      value: "2,100 GW+",
      label: "Global capacity (2023)",
    },
  },
  {
    id: "hydro",
    title: "Hydroelectric Energy",
    photoUrl:
      "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&q=80",
    tileColor: colors.tileHydro,
    accentColor: colors.sentryTeal,
    facts: [
      "Largest renewable electricity source worldwide.",
      "Dams serve as water storage and flood control.",
      "Pumped-storage acts as a giant rechargeable battery.",
    ],
    stat: {
      value: "~16%",
      label: "Share of global electricity",
    },
  },
  {
    id: "geothermal",
    title: "Geothermal Energy",
    photoUrl:
      "https://images.unsplash.com/photo-1544979590-37e9b47eb705?w=600&q=80",
    tileColor: colors.tileGeothermal,
    accentColor: colors.sentryTeal,
    facts: [
      "Available 24/7 — unaffected by weather.",
      "Iceland meets 66%+ of its energy needs geothermally.",
      "Used for both electricity and direct heating.",
    ],
    stat: {
      value: "~15 GW",
      label: "Global capacity (2023)",
    },
  },
  {
    id: "biomass",
    title: "Biomass Energy",
    photoUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    tileColor: colors.tileBiomass,
    accentColor: colors.sentryTeal,
    facts: [
      "Includes wood, crop waste, and organic materials.",
      "Carbon-neutral when sustainably managed.",
      "Provides reliable baseload power year-round.",
    ],
    stat: {
      value: "~130 GW",
      label: "Global capacity (2023)",
    },
  },
  {
    id: "tidal",
    title: "Tidal & Marine Energy",
    photoUrl:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80",
    tileColor: colors.tileTidal,
    accentColor: colors.sentryTeal,
    facts: [
      "Highly predictable — follows lunar cycles.",
      "Enormous untapped global potential.",
      "Costs falling rapidly as technology matures.",
    ],
    stat: {
      value: "~0.5 GW",
      label: "Global capacity (2023)",
    },
  },
];

export const HOME_CELLS: HomeCell[] = [
  {
    kind: "photo",
    type: ENERGY_TYPES[0],
  },
  {
    kind: "text",
    type: ENERGY_TYPES[0],
  },
  {
    kind: "photo",
    type: ENERGY_TYPES[1],
  },
  {
    kind: "text",
    type: ENERGY_TYPES[1],
  },
  {
    kind: "text",
    type: ENERGY_TYPES[2],
  },
  {
    kind: "photo",
    type: ENERGY_TYPES[2],
  },
  {
    kind: "text",
    type: ENERGY_TYPES[3],
  },
  {
    kind: "photo",
    type: ENERGY_TYPES[3],
  },
  {
    kind: "photo",
    type: ENERGY_TYPES[4],
  },
  {
    kind: "text",
    type: ENERGY_TYPES[4],
  },
  {
    kind: "photo",
    type: ENERGY_TYPES[5],
  },
  {
    kind: "text",
    type: ENERGY_TYPES[5],
  },
];