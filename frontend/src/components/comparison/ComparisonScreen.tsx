import { useState, useMemo } from "react";
import { useCountries } from "@/hooks/useCountries";
import { useGeneration } from "@/hooks/useGeneration";
import type { Country, CountryGeneration, SourceBreakdown } from "@/types/contract";
import { colors } from "@/lib/tokens";

const WIND_COLOR  = colors.indigoDeep;
const SOLAR_COLOR = "#b45309";
const GREEN_DARK  = colors.forest;
const GREEN_MID   = colors.forestMid;
const CARD_BG     = "#ffffff";
const CARD_BORDER = "#b8cdb8";
const HEADER_BG   = "#e8f3ea";
const TEXT_DARK   = "#111827";
const TEXT_MID    = "#374151";
const TEXT_MUTED  = "#6b7280";
const ROW_HOVER   = "#f0faf2";

function aggregateSources(bySource: SourceBreakdown[]) {
  let windMw = 0, solarMw = 0;
  for (const s of bySource) {
    if (s.source === "Wind onshore" || s.source === "Wind offshore") windMw += s.valueMw;
    if (s.source === "Solar") solarMw += s.valueMw;
  }
  return { windMw, solarMw, totalRenewable: windMw + solarMw };
}

function fmt(n: number) { return Math.round(n).toLocaleString("en-GB"); }

// Circular flag image using flagcdn.com (free, reliable, no API key needed)
function FlagCircle({ iso }: { iso: string }) {
  return (
    <img
      src={`https://flagcdn.com/48x36/${iso.toLowerCase()}.png`}
      alt={iso}
      style={{
        width: 36, height: 27,
        borderRadius: 4,
        objectFit: "cover",
        border: "1px solid rgba(0,0,0,0.1)",
        flexShrink: 0,
      }}
      onError={(e) => {
        // Fallback to text badge if image fails
        const el = e.currentTarget;
        el.style.display = "none";
        const next = el.nextElementSibling as HTMLElement;
        if (next) next.style.display = "inline-flex";
      }}
    />
  );
}

// Text fallback badge (hidden by default, shown if image fails)
function FallbackBadge({ iso }: { iso: string }) {
  const hue = ((iso.charCodeAt(0) * 37 + iso.charCodeAt(1) * 17) % 280) + 160;
  return (
    <span style={{
      display: "none",
      alignItems: "center", justifyContent: "center",
      minWidth: 36, height: 27, padding: "0 6px",
      background: `hsl(${hue}, 55%, 92%)`,
      color: `hsl(${hue}, 55%, 28%)`,
      border: `1px solid hsl(${hue}, 40%, 78%)`,
      borderRadius: 4, fontSize: 11, fontWeight: 800,
      fontFamily: "monospace",
    }}>
      {iso.toUpperCase()}
    </span>
  );
}

// ---- Rank badge ----
function RankBadge({ rank }: { rank: number }) {
  const configs: Record<number, { bg: string; color: string }> = {
    1: { bg: "#fef3c7", color: "#b45309" },
    2: { bg: "#f1f5f9", color: "#64748b" },
    3: { bg: "#fff7ed", color: "#c2410c" },
  };
  const cfg = configs[rank];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 30, height: 30, borderRadius: 8,
      background: cfg?.bg ?? "transparent",
      fontSize: 13, fontWeight: 700,
      color: cfg?.color ?? TEXT_MUTED,
      border: cfg ? `1px solid ${cfg.color}44` : "none",
    }}>
      {rank}
    </span>
  );
}

// ---- Ranking row ----
function RankRow({ rank, country, generation, maxMw, onOpen }: {
  rank: number; country: Country; generation: CountryGeneration;
  maxMw: number; onOpen: () => void;
}) {
  const { windMw, solarMw, totalRenewable } = aggregateSources(generation.bySource);
  const barW = maxMw > 0 ? (totalRenewable / maxMw) * 100 : 0;

  return (
    <tr
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      style={{ borderBottom: `1px solid ${CARD_BORDER}`, cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = ROW_HOVER)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Rank */}
      <td style={{ padding: "14px 16px 14px 20px", width: 52 }}>
        <RankBadge rank={rank} />
      </td>

      {/* Flag + name */}
      <td style={{ padding: "14px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FlagCircle iso={country.isoCode} />
          <FallbackBadge iso={country.isoCode} />
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{country.name}</span>
        </div>
      </td>

      {/* Wind */}
      <td style={{ padding: "14px 12px", textAlign: "right" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: WIND_COLOR }}>{fmt(windMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>

      {/* Solar */}
      <td style={{ padding: "14px 12px", textAlign: "right" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: SOLAR_COLOR }}>{fmt(solarMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>

      {/* Bar + total */}
      <td style={{ padding: "14px 24px", minWidth: 240 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: "#d1fae5", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${barW}%`, height: "100%",
              background: `linear-gradient(90deg, ${GREEN_MID}, ${GREEN_DARK})`,
              borderRadius: 3, transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: GREEN_DARK, width: 96, textAlign: "right" }}>
            {fmt(totalRenewable)} MW
          </span>
        </div>
      </td>
    </tr>
  );
}

function useAllGeneration(isoCodes: string[]) {
  const results = [
    useGeneration(isoCodes[0]??null), useGeneration(isoCodes[1]??null),
    useGeneration(isoCodes[2]??null), useGeneration(isoCodes[3]??null),
    useGeneration(isoCodes[4]??null), useGeneration(isoCodes[5]??null),
    useGeneration(isoCodes[6]??null), useGeneration(isoCodes[7]??null),
    useGeneration(isoCodes[8]??null), useGeneration(isoCodes[9]??null),
    useGeneration(isoCodes[10]??null), useGeneration(isoCodes[11]??null),
    useGeneration(isoCodes[12]??null), useGeneration(isoCodes[13]??null),
    useGeneration(isoCodes[14]??null), useGeneration(isoCodes[15]??null),
    useGeneration(isoCodes[16]??null), useGeneration(isoCodes[17]??null),
    useGeneration(isoCodes[18]??null), useGeneration(isoCodes[19]??null),
    useGeneration(isoCodes[20]??null), useGeneration(isoCodes[21]??null),
    useGeneration(isoCodes[22]??null), useGeneration(isoCodes[23]??null),
    useGeneration(isoCodes[24]??null), useGeneration(isoCodes[25]??null),
  ];
  const map: Record<string, CountryGeneration> = {};
  isoCodes.forEach((iso, i) => { if (results[i]?.data) map[iso] = results[i].data!; });
  const loading = results.slice(0, isoCodes.length).some((r) => r.loading);
  return { map, loading };
}

type SortKey = "total" | "wind" | "solar";

export function ComparisonScreen({ onOpenCountry }: { onOpenCountry: (iso: string) => void }) {
  const { countries, loading: countriesLoading } = useCountries();
  const [sortBy, setSortBy] = useState<SortKey>("total");
  const isoCodes = countries.map((c) => c.isoCode);
  const { map: generationMap, loading: genLoading } = useAllGeneration(isoCodes);
  const loading = countriesLoading || genLoading;

  const ranked = useMemo(() => {
    return countries
      .filter((c) => generationMap[c.isoCode])
      .map((c) => ({ country: c, generation: generationMap[c.isoCode], ...aggregateSources(generationMap[c.isoCode].bySource) }))
      .sort((a, b) => {
        if (sortBy === "wind") return b.windMw - a.windMw;
        if (sortBy === "solar") return b.solarMw - a.solarMw;
        return b.totalRenewable - a.totalRenewable;
      });
  }, [countries, generationMap, sortBy]);

  const maxMw = ranked[0]?.totalRenewable ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK, letterSpacing: "-0.02em" }}>
            Country Comparison
          </h1>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 4 }}>
            Ranked by solar & wind capacity · Click a row to open its dashboard
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          background: "#ffffff", borderRadius: 10, padding: 4,
          border: `1.5px solid ${CARD_BORDER}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {(["total", "wind", "solar"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              style={{
                fontSize: 13, fontWeight: sortBy === key ? 600 : 400,
                padding: "6px 18px", borderRadius: 7, border: "none",
                cursor: "pointer", transition: "all 0.15s",
                background: sortBy === key ? GREEN_DARK : "transparent",
                color: sortBy === key ? "#ffffff" : TEXT_MUTED,
              }}
            >
              {key === "total" ? "Total" : key === "wind" ? "Wind" : "Solar"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: CARD_BG, border: `1.5px solid ${CARD_BORDER}`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", fontSize: 14, color: TEXT_MUTED }}>
            Loading country data…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: HEADER_BG, borderBottom: `1.5px solid ${CARD_BORDER}` }}>
                  <th style={{ padding: "13px 16px 13px 20px", width: 52, textAlign: "left", fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>#</th>
                  <th style={{ padding: "13px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: TEXT_MID, textTransform: "uppercase", letterSpacing: "0.07em" }}>Country</th>
                  <th style={{ padding: "13px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, color: WIND_COLOR, textTransform: "uppercase", letterSpacing: "0.07em" }}>Wind (MW)</th>
                  <th style={{ padding: "13px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, color: SOLAR_COLOR, textTransform: "uppercase", letterSpacing: "0.07em" }}>Solar (MW)</th>
                  <th style={{ padding: "13px 24px", textAlign: "left", fontSize: 11, fontWeight: 700, color: GREEN_DARK, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total (MW)</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ country, generation }, i) => (
                  <RankRow
                    key={country.isoCode}
                    rank={i + 1}
                    country={country}
                    generation={generation}
                    maxMw={maxMw}
                    onOpen={() => onOpenCountry(country.isoCode)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, textAlign: "center", color: TEXT_MUTED }}>
        Solar & wind data · Energy-Charts.info (CC BY 4.0)
      </p>
    </div>
  );
}
