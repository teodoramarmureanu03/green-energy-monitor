import type { CSSProperties } from "react";
import { colors } from "@/lib/tokens";

const SOURCES = [
  {
    color: colors.indigoDeep,
    label: "Wind",
  },
  {
    color: colors.sentryTeal,
    label: "Solar",
  },
];

export function ChartLegend() {
  return (
    <div className="dashboard-chart-legend">
      {SOURCES.map((source) => (
        <ChartLegendItem key={source.label} {...source} />
      ))}
    </div>
  );
}

function ChartLegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  const legendStyle = {
    "--legend-color": color,
  } as CSSProperties;

  return (
    <div className="dashboard-chart-legend-item">
      <div className="dashboard-chart-legend-dot" style={legendStyle} />

      {label}
    </div>
  );
}