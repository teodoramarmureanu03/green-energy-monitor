import { useState, useMemo } from "react";
import { useCountries } from "@/hooks/useCountries";
import { useGeneration } from "@/hooks/useGeneration";
import type { Country, CountryGeneration, SourceBreakdown } from "@/types/contract";
import { colors } from "@/lib/tokens";

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
        minWidth: 38,
        height: 27,
        padding: "0 9px",
        background: "#eef0f2",
        color: "#374151",
        borderRadius: 7,
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
  const displayName = data?.country ?? iso;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      aria-label={`Open dashboard for ${displayName}`}
      className="card-interactive"
      style={{
        background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20,
        padding: "22px 24px", position: "relative",
        borderTop: `3px solid ${GREEN_MID}`,
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="icon-btn"
        style={{ position: "absolute", top: 16, right: 16, background: "#f3f4f6", width: 28, height: 28, borderRadius: "50%", fontSize: 14, color: TEXT_MUTED }}
        aria-label={`Unpin ${displayName}`}
      >×</button>
      <div style={{ marginBottom: 10 }}><CountryBadge iso={iso} /></div>
      <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_DARK, letterSpacing: "-0.01em", marginBottom: 16 }}>{data?.country ?? iso}</div>
      {data ? (
        <>
          {[
            { label: "💨 Wind", val: windMw, color: WIND_COLOR },
            { label: "☀️ Solar", val: solarMw, color: SOLAR_COLOR },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmt(val)} MW</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: GREEN_DARK, letterSpacing: "-0.01em" }}>{fmt(total)} MW</span>
          </div>
        </>
      ) : (
        <div style={{ height: 80, background: "#f9fafb", borderRadius: 8 }} />
      )}
    </div>
  );
}

// ---- Rank badge — medal for top 3, numbered chip otherwise ----
function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span style={{ fontSize: 20 }}>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</span>;
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 26, height: 26, borderRadius: "50%", background: "#f3f4f6",
      fontSize: 12, fontWeight: 700, color: TEXT_MUTED,
    }}>
      {rank}
    </span>
  );
}

// ---- Ranking row ----
function RankRow({ rank, country, generation, maxMw, isPinned, onPin, onOpen }: {
  rank: number; country: Country; generation: CountryGeneration; maxMw: number;
  isPinned: boolean; onPin: () => void; onOpen: () => void;
}) {
  const { windMw, solarMw, totalRenewable } = aggregateSources(generation.bySource);
  const barW = maxMw > 0 ? (totalRenewable / maxMw) * 100 : 0;
  const rankBg = rank === 1 ? "#fef9ec" : rank === 2 ? "#fafafa" : rank === 3 ? "#fdf6ee" : "transparent";

  return (
    <tr
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      aria-label={`Open dashboard for ${country.name}`}
      className="row-interactive"
      style={{ borderBottom: `1px solid ${BORDER}`, background: rankBg }}
    >
      <td style={{ padding: "20px 20px", width: 56 }}>
        <RankBadge rank={rank} />
      </td>
      <td style={{ padding: "20px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CountryBadge iso={country.isoCode} />
          <span style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK }}>{country.name}</span>
        </div>
      </td>
      <td style={{ padding: "20px 8px", textAlign: "right" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: WIND_COLOR }}>{fmt(windMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>
      <td style={{ padding: "20px 8px", textAlign: "right" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: SOLAR_COLOR }}>{fmt(solarMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>
      <td style={{ padding: "20px 24px", minWidth: 240 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 10, background: "#f3f4f6", borderRadius: 5, overflow: "hidden" }}>
            <div className="progress-fill" style={{ width: "100%", height: "100%", background: `linear-gradient(90deg, ${GREEN_MID}, ${GREEN_DARK})`, borderRadius: 5, transform: `scaleX(${barW / 100})` }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: GREEN_DARK, width: 84, textAlign: "right" }}>{fmt(totalRenewable)} MW</span>
        </div>
      </td>
      <td style={{ padding: "20px 20px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onPin}
          className="pin-btn"
          aria-pressed={isPinned}
          aria-label={isPinned ? `Unpin ${country.name}` : `Pin ${country.name}`}
          style={{
            "--pin-bg": isPinned ? GREEN_LIGHT : "#f9fafb",
            "--pin-color": isPinned ? GREEN_DARK : TEXT_MUTED,
            "--pin-border": isPinned ? GREEN_MID : "#e5e7eb",
          } as React.CSSProperties}
        >
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
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: TEXT_DARK, letterSpacing: "-0.02em" }}>Country Comparison</h1>
          <p style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 6 }}>Ranked by solar & wind capacity · Click a country to open its dashboard</p>
        </div>
        <div className="segmented">
          {(["total", "wind", "solar"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className="segmented-btn"
              data-active={sortBy === key || undefined}
              aria-pressed={sortBy === key}
            >
              {key === "total" ? "⚡ Total" : key === "wind" ? "💨 Wind" : "☀️ Solar"}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned */}
      {pinnedIsos.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>📌 Pinned countries</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>
            {pinnedIsos.map((iso) => (
              <PinnedCard key={iso} iso={iso} data={generationMap[iso] ?? null} onRemove={() => togglePin(iso)} onOpen={() => onOpenCountry(iso)} />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-elevated" style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 24, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 56, textAlign: "center", fontSize: 14, color: TEXT_MUTED }}>
            🌱 Loading country data…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}>
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
                  <th key={i} style={{ padding: "16px 16px", fontSize: 12, fontWeight: 700, color: col.color, textAlign: col.align, letterSpacing: "0.05em", textTransform: "uppercase" }}>{col.label}</th>
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
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, textAlign: "center", color: TEXT_MUTED }}>
        Solar & wind data · Energy-Charts.info (CC BY 4.0)
      </p>
    </div>
  );
}
