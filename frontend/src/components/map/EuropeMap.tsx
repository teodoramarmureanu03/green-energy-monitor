import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "@vnedyalk0v/react19-simple-maps";
import { useCountries } from "@/hooks/useCountries";
import { fetchGeneration } from "@/lib/api";
import { colors, shareToColor } from "@/lib/tokens";
import type { CountryGeneration } from "@/types/contract";
import europeMap from "@/assets/europe.json";
 
const GEO_URL = europeMap as unknown as string;
 

const ISO3_TO_ISO2: Record<string, string> = {
  AUT: "AT", BEL: "BE", BGR: "BG", CHE: "CH", CZE: "CZ", DEU: "DE",
  DNK: "DK", EST: "EE", ESP: "ES", FIN: "FI", FRA: "FR", GRC: "GR",
  HRV: "HR", HUN: "HU", IRL: "IE", ITA: "IT", LTU: "LT", LVA: "LV",
  NLD: "NL", NOR: "NO", POL: "PL", PRT: "PT", ROU: "RO", SWE: "SE",
  SVN: "SI", SVK: "SK",
};

// Forma unei țări din fișierul hărții (ce câmpuri are în "properties")
interface GeoProperties {
  iso_a3?: string;
  name?: string;
}

interface GeoFeature {
  rsmKey: string;  //o cheie adaugata pt fiecare tara, un fel de id unic
  properties: GeoProperties;
}

function geoIso(geo: GeoFeature): string | null {
  const iso3 = geo.properties?.iso_a3?.toUpperCase();
  if (!iso3) 
    return null;
  return ISO3_TO_ISO2[iso3] ?? null;
}
 
export function EuropeMap({onSelectCountry,}: {onSelectCountry?: (iso: string) => void;}) {
  const { countries } = useCountries();
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [hoverData, setHoverData] = useState<CountryGeneration | null>(null);
 
  // mapă rapidă isoCode -> % regenerabil, pentru colorat harta
  // SCHELET: aici colorăm pe baza datelor mock încărcate la hover.
  // Pentru colorat TOATE țările din start, încarcă toate datele o dată (vezi nota de jos).
  // procentele tuturor țărilor, încărcate o dată → colorăm toată harta din start
  const [pctByIso, setPctByIso] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (countries.length === 0) return;
    let cancelled = false;
    Promise.all(
      countries.map((c) =>
        fetchGeneration(c.isoCode)
          .then((d) => [c.isoCode, d.renewablePct] as const)
          .catch(() => null)
      )
    ).then((pairs) => {
      if (cancelled) return;
      const m = new Map<string, number>();
      pairs.forEach((p) => p && m.set(p[0], p[1]));
      setPctByIso(m);
    });
    return () => {
      cancelled = true;
    };
  }, [countries]);
 
  // setul de coduri pe care le avem în date (ca să știm ce e „clickabil")
  const known = useMemo(
    () => new Set(countries.map((c) => c.isoCode)),
    [countries]
  );
 
  async function handleEnter(iso: string) {
    setHoverIso(iso);
    if (!known.has(iso)) return;
    try {
      const data = await fetchGeneration(iso);
      setHoverData(data);
    } catch {
      setHoverData(null);
    }
  }
 
  return (
    <div className="relative">
      {/* The choropleth SVG has no native keyboard/screen-reader path (react-simple-maps
          renders bare <path> elements) — this list is the real accessible interface;
          the map below is hidden from assistive tech to avoid announcing it twice. */}
      <nav aria-label="Select a country">
        <ul className="sr-only">
          {countries.map((c) => (
            <li key={c.isoCode}>
              <button type="button" onClick={() => onSelectCountry?.(c.isoCode)}>
                {c.name}
                {pctByIso.has(c.isoCode) ? ` — ${pctByIso.get(c.isoCode)}% renewable` : ""}
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
    // @ts-expect-error pt a evita o eroare de tip la compilare
          center: [13, 52],
          scale: 700,
        }}
  style={{ width: "100%", height: "auto" }}
>
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo) => {
              const iso = geoIso(geo);
              const pct = iso ? pctByIso.get(iso) : undefined;
              const isHover = iso === hoverIso;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => iso && handleEnter(iso)}
                  onMouseLeave={() => {
                    setHoverIso(null);
                    setHoverData(null);
                  }}
                  onClick={() => iso && known.has(iso) && onSelectCountry?.(iso)}
                  style={{
                    default: {
                      fill: pct != null ? shareToColor(pct) : "#e4e4e7",
                      stroke: "#fafafa",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: isHover ? "#71717a" : "#d4d4d8",
                      stroke: "#fff",
                      strokeWidth: 0.75,
                      outline: "none",
                      cursor: iso && known.has(iso) ? "pointer" : "default",
                    },
                    pressed: { fill: colors.forestMid, outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      </div>

      {/* tooltip la hover */}
      {hoverData && (
        <div className="pointer-events-none absolute left-1/2 top-6 w-[220px] -translate-x-1/2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl">
          <div className="text-[14px] font-semibold text-zinc-800">
            {hoverData.country}
          </div>
          <div className="mb-2.5 mt-1 text-[12px] text-zinc-500">
            Renewable share <b className="text-zinc-900">{hoverData.renewablePct}%</b>
          </div>
          <div className="text-[11px] font-medium text-zinc-400">Click to open dashboard →</div>
        </div>
      )}

      {/* legend */}
      <div className="mt-6 flex items-center gap-3 text-[12px] font-medium text-zinc-500">
        <span>Low share</span>
        <div className="flex h-3.5 overflow-hidden rounded-full border border-zinc-100">
          {[colors.forestPale, colors.forestSoft, colors.forestMid, colors.forest].map((c) => (
            <div key={c} className="h-full w-9" style={{ background: c }} />
          ))}
        </div>
        <span>High share</span>
      </div>
    </div>
  );
}