import type {
  Country,
  CountryGeneration,
  SourceBreakdown,
} from "@/types/contract";

export type SortKey = "total" | "wind" | "solar";

export const SORT_OPTIONS: SortKey[] = ["total", "wind", "solar"];

export interface AggregatedSources {
  windMw: number;
  solarMw: number;
  totalRenewable: number;
}

export interface RankedCountryGeneration extends AggregatedSources {
  country: Country;
  generation: CountryGeneration;
}

export function aggregateSources(bySource: SourceBreakdown[]): AggregatedSources {
  let windMw = 0;
  let solarMw = 0;

  for (const source of bySource) {
    if (source.source === "Wind onshore" || source.source === "Wind offshore") {
      windMw += source.valueMw;
    }

    if (source.source === "Solar") {
      solarMw += source.valueMw;
    }
  }

  return {
    windMw,
    solarMw,
    totalRenewable: windMw + solarMw,
  };
}

export function formatMw(value: number) {
  return Math.round(value).toLocaleString("en-GB");
}

export function getSortLabel(sortKey: SortKey) {
  if (sortKey === "total") {
    return "Total";
  }

  if (sortKey === "wind") {
    return "Wind";
  }

  return "Solar";
}