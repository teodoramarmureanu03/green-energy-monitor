import type { SourceBreakdown } from "@/types/contract";

export interface AggregatedSources {
  windMw: number;
  solarMw: number;
}

export function aggregateSources(
  bySource: SourceBreakdown[]
): AggregatedSources {
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
  };
}

export function formatMw(value: number) {
  return Math.round(value).toLocaleString("en-GB");
}

export function formatCompactMw(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(Math.round(value));
}

export function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getSourcePercentages(windMw: number, solarMw: number) {
  const total = windMw + solarMw;

  if (total <= 0) {
    return {
      windPct: 0,
      solarPct: 0,
    };
  }

  const windPct = Math.round((windMw / total) * 100);

  return {
    windPct,
    solarPct: 100 - windPct,
  };
}