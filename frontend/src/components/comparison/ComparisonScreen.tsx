import { useState, useMemo } from "react";
import { useCountries } from "@/hooks/useCountries";
import { useGeneration } from "@/hooks/useGeneration";
import type { Country, CountryGeneration, SourceBreakdown } from "@/types/contract";
import { colors, shadows } from "@/lib/tokens";

const WIND_COLOR = colors.windBlue;
const SOLAR_COLOR = colors.solarAmber;
const GREEN_DARK = colors.forest;
const GREEN_MID = colors.forestMid;
const GREEN_LIGHT = colors.sageTint;
const CARD_BG = colors.surface;
const BORDER = colors.borderSage;
const TEXT_DARK = colors.ink;
const TEXT_MUTED = colors.muted;

function aggregateSources(bySource: SourceBreakdown[]) {
  let windMw = 0, solarMw = 0;
  for (const s of bySource) {
    if (s.source === "Wind onshore" || s.source === "Wind offshore") windMw += s.valueMw;
    if (s.source === "Solar") solarMw += s.valueMw;
  }
  return { windMw, solarMw, totalRenewable: windMw + solarMw };
}

function fmt(n: number) { return Math.round(n).toLocaleString("en-GB"); }

// Badge cu codul țării (merge pe orice sistem, spre deosebire de steagurile emoji
// care nu se afișează pe Windows).
function CountryBadge({ iso }: { iso: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 34,
        height: 24,
        padding: "0 8px",
        background: "#e5e7eb",
        color: "#374151",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "monospace",
        letterSpacing: "0.5px",
      }}
    >
      {iso.toUpperCase()}
    </span>
  );
}

// ---- Pinned card ----
function PinnedCard({ iso, data, onRemove, onOpen }: {
  iso: string; data: CountryGeneration | null; onRemove: () => void; onOpen: () => void;
}) {
  const { windMw, solarMw } = data ? aggregateSources(data.bySource) : { windMw: 0, solarMw: 0 };
  const total = windMw + solarMw;
  return (
    <div onClick={onOpen} style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16,
      padding: "18px 20px", cursor: "pointer", position: "relative",
      boxShadow: shadows.ambientCard, borderTop: `3px solid ${GREEN_MID}`,
      transition: "box-shadow 0.15s",
    }}>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", width: 24, height: 24, borderRadius: "50%", fontSize: 14, color: TEXT_MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        aria-label="Unpin"
      >×</button>
      <div style={{ marginBottom: 6 }}><CountryBadge iso={iso} /></div>
      <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>{data?.country ?? iso}</div>
      {data ? (
        <>
          {[
            { label: "💨 Wind", val: windMw, color: WIND_COLOR },
            { label: "☀️ Solar", val: solarMw, color: SOLAR_COLOR },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmt(val)} MW</span>
            </div>
          ))}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: GREEN_DARK }}>{fmt(total)} MW</span>
          </div>
        </>
      ) : (
        <div style={{ height: 80, background: "#f9fafb", borderRadius: 8 }} />
      )}
    </div>
  );
}

// ---- Ranking row ----
function RankRow({ rank, country, generation, maxMw, isPinned, onPin, onOpen }: {
  rank: number; country: Country; generation: CountryGeneration; maxMw: number;
  isPinned: boolean; onPin: () => void; onOpen: () => void;
}) {
  const { windMw, solarMw, totalRenewable } = aggregateSources(generation.bySource);
  const barW = maxMw > 0 ? (totalRenewable / maxMw) * 100 : 0;
  const rankBg = rank === 1 ? "#fef3c7" : rank === 2 ? "#f3f4f6" : rank === 3 ? "#fff7ed" : "transparent";
  const rankColor = rank === 1 ? "#d97706" : rank === 2 ? "#6b7280" : rank === 3 ? "#ea580c" : TEXT_MUTED;

  return (
    <tr
      onClick={onOpen}
      style={{ cursor: "pointer", borderBottom: `1px solid ${BORDER}`, background: rank <= 3 ? rankBg : "transparent" }}
    >
      <td style={{ padding: "14px 16px", width: 48 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: rankColor }}>
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
        </span>
      </td>
      <td style={{ padding: "14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CountryBadge iso={country.isoCode} />
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{country.name}</span>
        </div>
      </td>
      <td style={{ padding: "14px 8px", textAlign: "right" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: WIND_COLOR }}>{fmt(windMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>
      <td style={{ padding: "14px 8px", textAlign: "right" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: SOLAR_COLOR }}>{fmt(solarMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>
      <td style={{ padding: "14px 20px", minWidth: 220 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${barW}%`, height: "100%", background: `linear-gradient(90deg, ${GREEN_MID}, ${GREEN_DARK})`, borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: GREEN_DARK, width: 80, textAlign: "right" }}>{fmt(totalRenewable)} MW</span>
        </div>
      </td>
      <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => { e.stopPropagation(); onPin(); }}>
        <button style={{
          fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8, cursor: "pointer",
          background: isPinned ? GREEN_LIGHT : "#f9fafb",
          color: isPinned ? GREEN_DARK : TEXT_MUTED,
          border: `1.5px solid ${isPinned ? GREEN_MID : "#e5e7eb"}`,
        }}>
          {isPinned ? "★ Pinned" : "☆ Pin"}
        </button>
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
  const [pinnedIsos, setPinnedIsos] = useState<string[]>([]);
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
  const togglePin = (iso: string) => setPinnedIsos((prev) => prev.includes(iso) ? prev.filter((x) => x !== iso) : [...prev, iso].slice(0, 3));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT_DARK, letterSpacing: "-0.5px" }}>Country Comparison</h1>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 4 }}>Ranked by solar & wind capacity · Click a country to open its dashboard</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "6px 8px", boxShadow: shadows.inputSubtle }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, paddingLeft: 6 }}>Sort by:</span>
          {(["total", "wind", "solar"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                fontSize: 13, fontWeight: sortBy === key ? 600 : 400, padding: "7px 16px",
                borderRadius: 8, border: "none", cursor: "pointer",
                background: sortBy === key ? GREEN_LIGHT : "transparent",
                color: sortBy === key ? GREEN_DARK : TEXT_MUTED,
              }}
            >
              {key === "total" ? "⚡ Total" : key === "wind" ? "💨 Wind" : "☀️ Solar"}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned */}
      {pinnedIsos.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>📌 Pinned countries</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
            {pinnedIsos.map((iso) => (
              <PinnedCard key={iso} iso={iso} data={generationMap[iso] ?? null} onRemove={() => togglePin(iso)} onOpen={() => onOpenCountry(iso)} />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: shadows.ambientCard }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", fontSize: 14, color: TEXT_MUTED }}>
            🌱 Loading country data…
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.mist, borderBottom: `1px solid ${BORDER}` }}>
                {[
                  { label: "#", align: "left" as const, color: TEXT_MUTED },
                  { label: "Country", align: "left" as const, color: TEXT_MUTED },
                  { label: "💨 Wind (MW)", align: "right" as const, color: WIND_COLOR },
                  { label: "☀️ Solar (MW)", align: "right" as const, color: SOLAR_COLOR },
                  { label: "Total (MW)", align: "left" as const, color: GREEN_DARK },
                  { label: "", align: "right" as const, color: TEXT_MUTED },
                ].map((col, i) => (
                  <th key={i} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: col.color, textAlign: col.align, letterSpacing: "0.04em" }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ country, generation }, i) => (
                <RankRow
                  key={country.isoCode} rank={i + 1} country={country} generation={generation}
                  maxMw={maxMw} isPinned={pinnedIsos.includes(country.isoCode)}
                  onPin={() => togglePin(country.isoCode)} onOpen={() => onOpenCountry(country.isoCode)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 11, textAlign: "center", color: TEXT_MUTED }}>
        Solar & wind data · Energy-Charts.info (CC BY 4.0)
      </p>
    </div>
  );
}