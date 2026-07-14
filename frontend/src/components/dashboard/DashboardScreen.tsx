import { useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import { useCountries } from "@/hooks/useCountries";
import { useGeneration } from "@/hooks/useGeneration";
import { paths } from "@/routes/paths";
import { colors, shadows, skeletonGradient } from "@/lib/tokens";

import { DashboardHeader } from "./DashboardHeader";
import { DashboardContent } from "./DashboardContent";
import { DashboardSkeleton } from "./DashboardCards";

import "./DashboardScreen.css";

interface DashboardScreenProps {
  initialIso: string;
}

const dashboardCssVariables = {
  "--dashboard-wind-color": colors.indigoDeep,
  "--dashboard-solar-color": colors.sentryTeal,
  "--dashboard-green-dark": colors.forest,
  "--dashboard-green-light": colors.sageTint,

  "--dashboard-card-bg": colors.surface,
  "--dashboard-border": colors.borderAccent,
  "--dashboard-text-dark": colors.ink,
  "--dashboard-text-mid": colors.slate,
  "--dashboard-text-muted": colors.muted,

  "--dashboard-hero-bg": `linear-gradient(135deg, ${colors.indigoDeep} 0%, ${colors.steelNavy} 100%)`,
  "--dashboard-hero-shadow": shadows.ambientHero,
  "--dashboard-card-shadow": shadows.ambientCard,
  "--dashboard-tooltip-shadow": shadows.tooltipDark,

  "--dashboard-error-bg": colors.errorBg,
  "--dashboard-error-border": colors.errorBorder,
  "--dashboard-error-text": colors.errorRed,

  "--dashboard-skeleton-gradient": skeletonGradient,
  "--dashboard-track-bg": colors.trackBg,
} as CSSProperties;

export function DashboardScreen({ initialIso }: DashboardScreenProps) {
  const navigate = useNavigate();
  const { countries } = useCountries();
  const [selectedIso, setSelectedIso] = useState(initialIso);

  const { data, loading, error } = useGeneration(selectedIso);

  const countryName =
    countries.find((country) => country.isoCode === selectedIso)?.name ??
    selectedIso;

  return (
    <div className="dashboard-screen" style={dashboardCssVariables}>
      <DashboardHeader
        countries={countries}
        selectedIso={selectedIso}
        onCountryChange={(iso) => {
          setSelectedIso(iso);
          navigate(paths.dashboard(iso));
        }}
      />

      {loading && <DashboardSkeleton />}

      {error && <div className="dashboard-error">⚠️ {error}</div>}

      {data && !loading && (
        <DashboardContent
          data={data}
          countryName={countryName}
          selectedIso={selectedIso}
        />
      )}
    </div>
  );
}