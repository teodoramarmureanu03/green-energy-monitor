import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  type Longitude,
  type Latitude,
} from "@vnedyalk0v/react19-simple-maps";

import { useCountries } from "@/hooks/useCountries";
import { fetchGeneration } from "@/lib/api";
import { colors, shareToColor } from "@/lib/tokens";
import type { Country, CountryGeneration } from "@/types/contract";
import europeMap from "@/assets/europe.json";
import countriesRaw from "@/data/countries.json";

import { MapLegend } from "./MapLegend";
import { MapTooltip } from "./MapTooltip";
import { geoIso, type GeoFeature } from "./mapUtils";

const GEO_URL = europeMap as unknown as string;
const countriesData = countriesRaw as Country[];

interface EuropeMapProps {
  onSelectCountry?: (iso: string) => void;
}

export function EuropeMap({ onSelectCountry }: EuropeMapProps) {
  const { countries } = useCountries();
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [hoverData, setHoverData] = useState<CountryGeneration | null>(null);
  const [pctByIso, setPctByIso] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (countries.length === 0) {
      return;
    }

    let cancelled = false;

    Promise.all(
      countries.map((country) =>
        fetchGeneration(country.isoCode)
          .then((data) => [country.isoCode, data.renewablePct] as const)
          .catch(() => null)
      )
    ).then((pairs) => {
      if (cancelled) {
        return;
      }

      const nextMap = new Map<string, number>();
      for (const pair of pairs) {
        if (pair) {
          nextMap.set(pair[0], pair[1]);
        }
      }
      setPctByIso(nextMap);
    });

    return () => {
      cancelled = true;
    };
  }, [countries]);

  const known = useMemo(
    () => new Set(countries.map((country) => country.isoCode)),
    [countries]
  );

  async function handleEnter(iso: string) {
    setHoverIso(iso);

    if (!known.has(iso)) {
      return;
    }

    try {
      const data = await fetchGeneration(iso);
      setHoverData(data);
    } catch {
      setHoverData(null);
    }
  }

  return (
    <div className="map-canvas">
      {/* SVG map paths are not keyboard-accessible; this list is the a11y entry point. */}
      <nav aria-label="Select a country">
        <ul className="sr-only">
          {countries.map((country) => (
            <li key={country.isoCode}>
              <button
                type="button"
                onClick={() => onSelectCountry?.(country.isoCode)}
              >
                {country.name}
                {pctByIso.has(country.isoCode)
                  ? ` — ${pctByIso.get(country.isoCode)}% renewable`
                  : ""}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div aria-hidden="true">
        <ComposableMap
          projection="geoMercator"
          width={800}
          height={520}
          projectionConfig={{
            center: [13 as Longitude, 52 as Latitude],
            scale: 700,
          }}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {(props) => {
              const geographies = props.geographies as GeoFeature[];

              return geographies.map((typedGeo) => {
                const iso = geoIso(typedGeo);
                const pct = iso ? pctByIso.get(iso) : undefined;
                const isHover = iso === hoverIso;

                return (
                  <Geography
                    key={typedGeo.rsmKey}
                    geography={typedGeo}
                    onMouseEnter={() => iso && void handleEnter(iso)}
                    onMouseLeave={() => {
                      setHoverIso(null);
                      setHoverData(null);
                    }}
                    onClick={() =>
                      iso && known.has(iso) && onSelectCountry?.(iso)
                    }
                    style={{
                      default: {
                        fill: pct != null ? shareToColor(pct) : colors.noData,
                        stroke: colors.mapStroke,
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: isHover
                          ? colors.mapHoverActiveFill
                          : colors.mapHoverFill,
                        stroke: colors.mapHoverStroke,
                        strokeWidth: 0.75,
                        outline: "none",
                        cursor: iso && known.has(iso) ? "pointer" : "default",
                      },
                      pressed: { fill: colors.forestMid, outline: "none" },
                    }}
                  />
                );
              });
            }}
          </Geographies>

          {countriesData.map((country) => (
            <Marker
              key={country.isoCode}
              coordinates={[country.lng, country.lat]}
            >
              <text textAnchor="middle" className="map-marker-label">
                {country.isoCode}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </div>

      {hoverData && <MapTooltip data={hoverData} />}

      <MapLegend />
    </div>
  );
}
