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

function CountryBadge({ iso }: { iso: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 36, height: 24, padding: "0 8px",
      background: colors.mist, color: colors.slate,
      borderRadius: 5, fontSize: 11, fontWeight: 700,
      fontFamily: "monospace", letterSpacing: "0.5px",
      border: `1px solid ${BORDER}`,
    }}>
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
      role="button" tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      aria-label={`Open dashboard for ${displayName}`}
      style={{
        background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: "20px 22px", position: "relative", cursor: "pointer",
        borderLeft: `4px solid ${GREEN_MID}`,
        boxShadow: shadows.ambientCard, transition: "box-shadow 0.15s",
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{
          position: "absolute", top: 14, right: 14,
          background: colors.chipBg, border: "none", width: 26, height: 26,
          borderRadius: "50%", fontSize: 14, color: TEXT_MUTED, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        aria-label={`Unpin ${displayName}`}
      >×</button>
      <div style={{ marginBottom: 8 }}><CountryBadge iso={iso} /></div>
      <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_DARK, marginBottom: 14 }}>{displayName}</div>
      {data ? (
        <>
          {[
            { label: "Wind", val: windMw, color: WIND_COLOR },
            { label: "Solar", val: solarMw, color: SOLAR_COLOR },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: TEXT_MUTED }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmt(val)} <span style={{ fontSize: 11, fontWeight: 400 }}>MW</span></span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }}>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: GREEN_DARK }}>{fmt(total)} MW</span>
          </div>
        </>
      ) : (
        <div style={{ height: 72, background: colors.mist, borderRadius: 8 }} />
      )}
    </div>
  );
}

// ---- Rank indicator — clean number, no medals ----
function RankCell({ rank }: { rank: number }) {
  const top3Colors: Record<number, string> = { 1: colors.rankGoldText, 2: TEXT_MUTED, 3: colors.rankBronzeText };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: 6,
      background: rank <= 3 ? (rank === 2 ? colors.chipBg : colors.rankAmberBg) : "transparent",
      fontSize: 13, fontWeight: 700,
      color: top3Colors[rank] ?? TEXT_MUTED,
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

  return (
    <tr
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="row-interactive"
      style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
    >
      {/* Rank */}
      <td style={{ padding: "16px 16px 16px 20px", width: 52 }}>
        <RankCell rank={rank} />
      </td>

      {/* Country */}
      <td style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CountryBadge iso={country.isoCode} />
          <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{country.name}</span>
        </div>
      </td>

      {/* Wind */}
      <td style={{ padding: "16px 12px", textAlign: "right" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: WIND_COLOR }}>{fmt(windMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>

      {/* Solar */}
      <td style={{ padding: "16px 12px", textAlign: "right" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: SOLAR_COLOR }}>{fmt(solarMw)}</span>
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 3 }}>MW</span>
      </td>

      {/* Total + bar */}
      <td style={{ padding: "16px 20px", minWidth: 220 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: colors.trackBg, borderRadius: 3, overflow: "hidden" }}>
            <div
              className="progress-fill"
              style={{
                width: "100%", height: "100%",
                background: `linear-gradient(90deg, ${GREEN_MID}, ${GREEN_DARK})`,
                borderRadius: 3, transform: `scaleX(${barW / 100})`,
              }}
            />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: GREEN_DARK, width: 88, textAlign: "right" }}>{fmt(totalRenewable)} MW</span>
        </div>
      </td>

      {/* Pin */}
      <td style={{ padding: "16px 20px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onPin}
          aria-pressed={isPinned}
          aria-label={isPinned ? `Unpin ${country.name}` : `Pin ${country.name}`}
          style={{
            fontSize: 12, fontWeight: 500, padding: "5px 14px",
            borderRadius: 7, cursor: "pointer", border: "none",
            background: isPinned ? GREEN_LIGHT : colors.chipBg,
            color: isPinned ? GREEN_DARK : TEXT_MUTED,
            transition: "all 0.15s",
          }}
        >
          {isPinned ? "★ Pinned" : "Pin"}
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
  const togglePin = (iso: string) => setPinnedIsos((prev) =>
    prev.includes(iso) ? prev.filter((x) => x !== iso) : [...prev, iso].slice(0, 3)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK, letterSpacing: "-0.02em" }}>Country Comparison</h1>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 4 }}>
            Ranked by solar & wind capacity · Click a row to open its dashboard
          </p>
        </div>

        {/* Sort controls — clean pill segmented control */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          background: colors.mist, borderRadius: 10, padding: 4,
          border: `1px solid ${BORDER}`,
        }}>
          {([
            { key: "total" as SortKey, label: "Total" },
            { key: "wind" as SortKey, label: "Wind" },
            { key: "solar" as SortKey, label: "Solar" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              style={{
                fontSize: 13, fontWeight: sortBy === key ? 600 : 400,
                padding: "6px 16px", borderRadius: 7, border: "none",
                cursor: "pointer", transition: "all 0.15s",
                background: sortBy === key ? CARD_BG : "transparent",
                color: sortBy === key ? TEXT_DARK : TEXT_MUTED,
                boxShadow: sortBy === key ? shadows.ambientCard : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned cards */}
      {pinnedIsos.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Pinned countries
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            {pinnedIsos.map((iso) => (
              <PinnedCard
                key={iso} iso={iso}
                data={generationMap[iso] ?? null}
                onRemove={() => togglePin(iso)}
                onOpen={() => onOpenCountry(iso)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: CARD_BG, border: `1px solid ${BORDER}`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: shadows.ambientCard,
      }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", fontSize: 14, color: TEXT_MUTED }}>
            Loading country data…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.mist, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: "12px 16px 12px 20px", width: 52, textAlign: "left" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>#</span>
                  </th>
                  <th style={{ padding: "12px 12px", textAlign: "left" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>Country</span>
                  </th>
                  <th style={{ padding: "12px 12px", textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: WIND_COLOR, textTransform: "uppercase", letterSpacing: "0.07em" }}>Wind (MW)</span>
                  </th>
                  <th style={{ padding: "12px 12px", textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: SOLAR_COLOR, textTransform: "uppercase", letterSpacing: "0.07em" }}>Solar (MW)</span>
                  </th>
                  <th style={{ padding: "12px 20px", textAlign: "left" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: GREEN_DARK, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total (MW)</span>
                  </th>
                  <th style={{ padding: "12px 20px" }} />
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
                    isPinned={pinnedIsos.includes(country.isoCode)}
                    onPin={() => togglePin(country.isoCode)}
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
