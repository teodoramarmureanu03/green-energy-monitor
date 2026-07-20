import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import { colors } from "@/lib/tokens";
import { paths } from "@/routes/paths";

import { EuropeMap } from "./EuropeMap";

import "./MapScreen.css";

const mapCssVariables = {
  "--map-text-dark": colors.ink,
  "--map-text-muted": colors.muted,
  "--map-card-bg": colors.surface,
  "--map-card-border": colors.borderAccent,
  "--map-tooltip-border": colors.borderAccent,
  "--map-tooltip-text": colors.ink,
  "--map-tooltip-muted": colors.muted,
} as CSSProperties;

export function MapScreen() {
  const navigate = useNavigate();

  return (
    <div className="map-screen" style={mapCssVariables}>
      <header className="map-header">
        <h1 className="map-title">Europe Map</h1>
        <p className="map-subtitle">
          Click a country to open its solar & wind investment dashboard
        </p>
      </header>

      <div className="map-card">
        <EuropeMap
          onSelectCountry={(iso) => navigate(paths.dashboard(iso))}
        />
      </div>
    </div>
  );
}
