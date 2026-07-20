import type { CSSProperties } from "react";
import { colors, gradients } from "@/lib/tokens";

import { HomeHero } from "./HomeHero";
import { EnergyMosaic } from "./EnergyMosaic";
import { HOME_CELLS } from "./homeData";

import "./HomeScreen.css";

const homeCssVariables = {
  "--home-hero-bg": gradients.heroDark,
  "--home-accent": colors.sentryTeal,
  "--home-text-dark": colors.ink,
  "--home-text-muted": colors.muted,
} as CSSProperties;

export function HomeScreen() {
  return (
    <div className="home-screen" style={homeCssVariables}>
      <HomeHero />

      <section className="home-section-heading">
        <h2 className="home-section-title">Renewable energy types</h2>

        <p className="home-section-subtitle">
          Click a coloured tile to learn more · navigate to the map to explore
          country data
        </p>
      </section>

      <EnergyMosaic cells={HOME_CELLS} />

      <p className="home-footer">
        Global capacity figures from IRENA 2023 · Photos: Unsplash
      </p>
    </div>
  );
}
