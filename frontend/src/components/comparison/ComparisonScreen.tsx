import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useCountries } from "@/hooks/useCountries";
import { colors } from "@/lib/tokens";
import { paths } from "@/routes/paths";

import { ComparisonHeader } from "./ComparisonHeader";
import { ComparisonTable } from "./ComparisonTable";
import { useAllGeneration } from "./useAllGeneration";
import {
  aggregateSources,
  type RankedCountryGeneration,
  type SortKey,
} from "./comparisonUtils";

import "./ComparisonScreen.css";

const comparisonCssVariables = {
  "--comparison-wind-color": colors.indigoDeep,
  "--comparison-solar-color": colors.rankGoldText,
  "--comparison-green-dark": colors.forest,
  "--comparison-green-mid": colors.forestMid,
  "--comparison-card-bg": colors.surface,
  "--comparison-card-border": colors.borderAccent,
  "--comparison-header-bg": colors.tableHeaderBg,
  "--comparison-text-dark": colors.ink,
  "--comparison-text-mid": colors.slate,
  "--comparison-text-muted": colors.muted,
  "--comparison-row-hover": colors.rowHoverBg,
  "--comparison-sage-tint": colors.sageTint,
  "--comparison-button-text": colors.btnSolidText,
  "--comparison-flag-border": colors.flagBorder,

  "--comparison-rank-gold-bg": colors.rankGoldBg,
  "--comparison-rank-gold-text": colors.rankGoldText,
  "--comparison-rank-gold-border": colors.rankGoldBorder,

  "--comparison-rank-silver-bg": colors.rankSilverBg,
  "--comparison-rank-silver-text": colors.rankSilverText,
  "--comparison-rank-silver-border": colors.rankSilverBorder,

  "--comparison-rank-bronze-bg": colors.rankBronzeBg,
  "--comparison-rank-bronze-text": colors.rankBronzeText,
  "--comparison-rank-bronze-border": colors.rankBronzeBorder,
} as CSSProperties;

export function ComparisonScreen() {
  const navigate = useNavigate();
  const { countries, loading: countriesLoading } = useCountries();
  const [sortBy, setSortBy] = useState<SortKey>("total");

  const isoCodes = countries.map((country) => country.isoCode);
  const { map: generationMap, loading: generationLoading } =
    useAllGeneration(isoCodes);

  const loading = countriesLoading || generationLoading;

  const ranked = useMemo<RankedCountryGeneration[]>(() => {
    return countries
      .flatMap((country) => {
        const generation = generationMap[country.isoCode];

        if (!generation) {
          return [];
        }

        return [
          {
            country,
            generation,
            ...aggregateSources(generation.bySource),
          },
        ];
      })
      .sort((a, b) => {
        if (sortBy === "wind") {
          return b.windMw - a.windMw;
        }

        if (sortBy === "solar") {
          return b.solarMw - a.solarMw;
        }

        return b.totalRenewable - a.totalRenewable;
      });
  }, [countries, generationMap, sortBy]);

  const maxMw = ranked[0]?.totalRenewable ?? 1;

  return (
    <div className="comparison-screen" style={comparisonCssVariables}>
      <ComparisonHeader sortBy={sortBy} onSortChange={setSortBy} />

      <ComparisonTable
        loading={loading}
        ranked={ranked}
        maxMw={maxMw}
        onOpenCountry={(iso) =>
          navigate(paths.dashboard(iso))
        }
      />

      <p className="comparison-footer">
        Solar & wind data · Energy-Charts.info (CC BY 4.0)
      </p>
    </div>
  );
}
