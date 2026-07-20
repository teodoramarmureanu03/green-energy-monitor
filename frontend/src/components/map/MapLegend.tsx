import { colors } from "@/lib/tokens";

const LEGEND_STOPS = [
  colors.forestPale,
  colors.forestSoft,
  colors.forestMid,
  colors.forest,
] as const;

export function MapLegend() {
  return (
    <div className="map-legend">
      <span>Low share</span>

      <div className="map-legend-bar">
        {LEGEND_STOPS.map((stop) => (
          <div
            key={stop}
            className="map-legend-stop"
            style={{ background: stop }}
          />
        ))}
      </div>

      <span>High share</span>
    </div>
  );
}
