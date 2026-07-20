import type { CountryGeneration } from "@/types/contract";

interface MapTooltipProps {
  data: CountryGeneration;
}

export function MapTooltip({ data }: MapTooltipProps) {
  return (
    <div className="map-tooltip">
      <div className="map-tooltip-country">{data.country}</div>

      <div className="map-tooltip-share">
        Renewable share{" "}
        <b className="map-tooltip-share-value">{data.renewablePct}%</b>
      </div>

      <div className="map-tooltip-hint">Click to open dashboard →</div>
    </div>
  );
}
