import { useState } from "react";
import { useGeneration } from "@/hooks/useGeneration";
import { useCountries } from "@/hooks/useCountries";
import type { CountryGeneration, SourceBreakdown } from "@/types/contract";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { colors, shadows } from "@/lib/tokens";

// ---- Design tokens (see src/lib/tokens.ts / DESIGN.md) ----
const WIND_COLOR = colors.windBlue;
const SOLAR_COLOR = colors.solarAmber;
const GREEN_DARK = colors.forest;
const GREEN_MID = colors.forestMid;
const GREEN_LIGHT = colors.sageTint;
const CARD_BG = colors.surface;
const TEXT_DARK = colors.ink;
const TEXT_MID = colors.slate;
const TEXT_MUTED = colors.muted;
const BORDER = colors.borderSage;

function aggregateSources(bySource: SourceBreakdown[]) {
  let windMw = 0, solarMw = 0;
  for (const s of bySource) {
    if (s.source === "Wind onshore" || s.source === "Wind offshore") windMw += s.valueMw;
    if (s.source === "Solar") solarMw += s.valueMw;
  }
  return { windMw, solarMw };
}

function fmt(n: number) { return Math.round(n).toLocaleString("en-GB"); }

// ---- KPI card ----
function KpiCard({ label, value, unit, sub, topColor, icon, iconBg }: {
  label: string; value: string; unit: string; sub: string;
  topColor: string; icon: string; iconBg: string;
}) {
  return (
    <div style={{
      background: CARD_BG, borderRadius: 16, padding: "22px 24px",
      border: `1px solid ${BORDER}`, borderTop: `4px solid ${topColor}`,
      boxShadow: shadows.ambientCard,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK, lineHeight: 1, marginBottom: 6 }}>
        {value}<span style={{ fontSize: 16, fontWeight: 500, color: TEXT_MUTED, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{sub}</div>
    </div>
  );
}

// ---- Section card ----
function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG, borderRadius: 16, padding: "24px",
      border: `1px solid ${BORDER}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", ...style,
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, marginBottom: 20 }}>{title}</h3>
      {children}
    </div>
  );
}

// ---- Custom tooltip ----
function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: colors.charcoal, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fff", boxShadow: shadows.tooltipDark }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{payload[0].name}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>{fmt(payload[0].value)} MW</div>
    </div>
  );
}

// ---- Skeleton ----
function Skeleton() {
  const shimmer = { background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)", borderRadius: 12 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ ...shimmer, height: 120 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...shimmer, height: 280 }} />
        <div style={{ ...shimmer, height: 280 }} />
      </div>
    </div>
  );
}

interface DashboardScreenProps { initialIso: string; }

export function DashboardScreen({ initialIso }: DashboardScreenProps) {
  const { countries } = useCountries();
  const [selectedIso, setSelectedIso] = useState(initialIso);
  const { data, loading, error } = useGeneration(selectedIso);
  const countryName = countries.find((c) => c.isoCode === selectedIso)?.name ?? selectedIso;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT_DARK, letterSpacing: "-0.5px" }}>Country Dashboard</h1>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 4 }}>Solar & wind investment snapshot for Europe</p>
        </div>
        <select
          value={selectedIso}
          onChange={(e) => setSelectedIso(e.target.value)}
          style={{
            fontSize: 14, fontWeight: 500, padding: "10px 16px", borderRadius: 10,
            border: `1.5px solid ${BORDER}`, background: CARD_BG, color: TEXT_DARK,
            cursor: "pointer", boxShadow: shadows.inputSubtle,
            minWidth: 160,
          }}
        >
          {countries.map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
        </select>
      </div>

      {loading && <Skeleton />}
      {error && (
        <div style={{ background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorRed, borderRadius: 12, padding: "16px 20px", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}
      {data && !loading && <DashboardContent data={data} countryName={countryName} />}
    </div>
  );
}

function DashboardContent({ data, countryName }: { data: CountryGeneration; countryName: string }) {
  const { windMw, solarMw } = aggregateSources(data.bySource);
  const total = windMw + solarMw;
  const shareOfTotal = data.total > 0 ? ((total / data.total) * 100).toFixed(1) : "—";
  const windPct = total > 0 ? Math.round((windMw / total) * 100) : 0;
  const solarPct = 100 - windPct;

  const updatedAt = new Date(data.timestamp).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const pieData = [
    { name: "Wind", value: Math.round(windMw) },
    { name: "Solar", value: Math.round(solarMw) },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Wind", mw: Math.round(windMw) },
    { name: "Solar", mw: Math.round(solarMw) },
  ].filter((d) => d.mw > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Country + timestamp badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, background: GREEN_LIGHT,
        color: GREEN_DARK, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, width: "fit-content",
      }}>
        📍 {countryName} · Updated {updatedAt}
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16 }}>
        <KpiCard label="Wind capacity" value={fmt(windMw)} unit="MW" sub="Onshore + offshore" topColor={WIND_COLOR} icon="💨" iconBg="#eff6ff" />
        <KpiCard label="Solar capacity" value={fmt(solarMw)} unit="MW" sub="Photovoltaic" topColor={SOLAR_COLOR} icon="☀️" iconBg="#fffbeb" />
        <KpiCard label="Wind + solar total" value={fmt(total)} unit="MW" sub="Combined renewables" topColor={GREEN_MID} icon="⚡" iconBg={GREEN_LIGHT} />
        <KpiCard label="Share of output" value={shareOfTotal} unit="%" sub={`of ${fmt(data.total)} MW total`} topColor={colors.investmentViolet} icon="📊" iconBg="#f5f3ff" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Donut */}
        <Card title="Solar vs wind mix">
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_MID }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: WIND_COLOR }} />Wind
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_MID }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: SOLAR_COLOR }} />Solar
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === "Wind" ? WIND_COLOR : SOLAR_COLOR} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar chart */}
        <Card title="Capacity by source (MW)">
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_MID }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: WIND_COLOR }} />Wind
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_MID }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: SOLAR_COLOR }} />Solar
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TEXT_MUTED }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="mw" radius={[6, 6, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === "Wind" ? WIND_COLOR : SOLAR_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Investment snapshot */}
      <Card title="Investment snapshot — wind vs solar breakdown">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { label: "Wind (onshore + offshore)", mw: windMw, pct: windPct, color: WIND_COLOR, bg: "#eff6ff", icon: "💨" },
            { label: "Solar (photovoltaic)", mw: solarMw, pct: solarPct, color: SOLAR_COLOR, bg: "#fffbeb", icon: "☀️" },
          ].map(({ label, mw, pct, color, bg, icon }) => (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{label}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{fmt(mw)} MW</div>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{pct}%</div>
              </div>
              <div style={{ height: 10, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.7s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p style={{ fontSize: 11, textAlign: "center", color: TEXT_MUTED }}>
        Solar & wind data · Energy-Charts.info (CC BY 4.0)
      </p>
    </div>
  );
}