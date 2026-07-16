import type { Latitude, Longitude } from "@vnedyalk0v/react19-simple-maps";

export interface Country {
  id: string;
  isoCode: string;
  name: string;
  lat: Latitude;
  lng: Longitude;
  multiZone: boolean;
  zones: string[];
}

export type EnergySourceName =
  | "Nuclear"
  | "Fossil brown coal"
  | "Fossil hard coal"
  | "Fossil gas"
  | "Hydro Run-of-River"
  | "Hydro water reservoir"
  | "Wind onshore"
  | "Wind offshore"
  | "Solar"
  | "Biomass";

export interface SourceBreakdown {
  source: EnergySourceName;
  renewable: boolean;
  valueMw: number;
}

export interface CountryGeneration {
  isoCode: string;
  country: string;
  timestamp: string;
  zonesAggregated: string[];
  total: number;
  renewableMw: number;
  renewablePct: number;
  bySource: SourceBreakdown[];
}

export type HistoryPeriod = "week" | "month" | "year";

export interface GenerationHistoryApiPoint {
  date: string;
  total: number;
  renewableMw: number;
  renewablePct: number;
  windMw: number;
  solarMw: number;
}

export interface GenerationHistoryPoint {
  date: string;
  label: string;
  tooltipLabel: string;
  total: number;
  renewableMw: number;
  windMw: number;
  solarMw: number;
}

export interface TimeseriesPoint {
  timestamp: string;
  total: number;
  renewableMw: number;
}

export interface CountryTimeseries {
  isoCode: string;
  date: string;
  points: TimeseriesPoint[];
}

export type DisplayCategory =
  "Wind" | "Solar" | "Hydro" | "Biomass" | "Nuclear" | "Fossil";

export function toDisplayCategory(source: EnergySourceName): DisplayCategory {
  if (source.startsWith("Wind")) return "Wind";
  if (source === "Solar") return "Solar";
  if (source.startsWith("Hydro")) return "Hydro";
  if (source === "Biomass") return "Biomass";
  if (source === "Nuclear") return "Nuclear";

  return "Fossil";
}
