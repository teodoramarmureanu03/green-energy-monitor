import { useState } from "react";
import { useGeneration } from "@/hooks/useGeneration";
import { useCountries } from "@/hooks/useCountries";
import type { CountryGeneration, SourceBreakdown } from "@/types/contract";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { colors, shadows, skeletonGradient } from "@/lib/tokens";

// ---- Enevo brand colors ----
const WIND_COLOR  = colors.indigoDeep;
const SOLAR_COLOR = colors.sentryTeal;
const GREEN_DARK  = colors.forest;
const GREEN_LIGHT = colors.sageTint;
const CARD_BG     = colors.surface;
const TEXT_DARK   = colors.ink;
const TEXT_MID    = colors.slate;
const TEXT_MUTED  = colors.muted;
const BORDER      = colors.borderAccent;

function aggregateSources(bySource: SourceBreakdown[]) {
  let windMw = 0, solarMw = 0;
  for (const s of bySource) {
    if (s.source === "Wind onshore" || s.source === "Wind offshore") windMw += s.valueMw;
    if (s.source === "Solar") solarMw += s.valueMw;
  }
  return { windMw, solarMw };
}

function fmt(n: number) { return Math.round(n).toLocaleString("en-GB"); }
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)); }

// ---- Hero KPI card ----
function HeroKpiCard({ label, value, unit, sub, icon }: {
  label: string; value: string; unit: string; sub: string; icon: string;
}) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.indigoDeep} 0%, ${colors.steelNavy} 100%)`,
      borderRadius: 20, padding: "28px 32px", color: "#fff",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      minHeight: 168, boxShadow: shadows.ambientHero,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: colors.sentryTeal }}>
          {value}<span style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>{unit}</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{sub}</div>
      </div>
    </div>
  );
}

// ---- Secondary KPI card ----
function KpiCard({ label, value, unit, sub, topColor, icon, iconBg }: {
  label: string; value: string; unit: string; sub: string;
  topColor: string; icon: string; iconBg: string;
}) {
  return (
    <div style={{
      background: CARD_BG, borderRadius: 20, padding: "20px 24px 24px",
      minHeight: 168, display: "flex", flexDirection: "column", justifyContent: "space-between",
      border: `1.5px solid ${BORDER}`, borderTop: `6px solid ${topColor}`,
      boxShadow: shadows.ambientCard,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: TEXT_DARK, lineHeight: 1, marginBottom: 4 }}>
          {value}<span style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, marginLeft: 4 }}>{unit}</span>
        </div>
        <div style={{ fontSize: 12, color: TEXT_MUTED }}>{sub}</div>
      </div>
    </div>
  );
}

// ---- Section card ----
function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG, borderRadius: 20, padding: "24px 28px",
      border: `1.5px solid ${BORDER}`, boxShadow: shadows.ambientCard, ...style,
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

// ---- Bar top label ----
function BarTopLabel(props: { x?: number; y?: number; width?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, value = 0 } = props;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill={TEXT_MID} fontSize={13} fontWeight={600}>
      {fmtK(value)} MW
    </text>
  );
}

// ---- Pie slice label ----
// Large slices (>15%): label inside the slice
// Small slices (5-15%): label outside with a connector line
function PieSliceLabel(props: {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number;
  name?: string; value?: number; percent?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, name = "", value = 0, percent = 0 } = props;
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const k = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
  const pctStr = `${(percent * 100).toFixed(0)}%`;

  if (percent >= 0.15) {
    // Inside label
    const r = innerRadius + (outerRadius - innerRadius) * 0.58;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <g>
        <text x={x} y={y - 10} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={600} opacity={0.85}>{name}</text>
        <text x={x} y={y + 6}  textAnchor="middle" fill="#fff" fontSize={16} fontWeight={700}>{k} MW</text>
        <text x={x} y={y + 22} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={12}>{pctStr}</text>
      </g>
    );
  }

  // Outside label with line
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = cx + (outerRadius + 55) * cos;
  const ey = cy + (outerRadius + 55) * sin;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <line x1={cx + outerRadius * cos} y1={cy + outerRadius * sin} x2={mx} y2={my} stroke={TEXT_MUTED} strokeWidth={1.5} />
      <line x1={mx} y1={my} x2={ex} y2={ey} stroke={TEXT_MUTED} strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={2} fill={TEXT_MUTED} />
      <text x={ex + (cos >= 0 ? 6 : -6)} y={ey - 7} textAnchor={textAnchor} fill={TEXT_DARK} fontSize={12} fontWeight={700}>{name}</text>
      <text x={ex + (cos >= 0 ? 6 : -6)} y={ey + 8} textAnchor={textAnchor} fill={TEXT_MUTED} fontSize={11}>{k} MW · {pctStr}</text>
    </g>
  );
}

// ---- Skeleton ----
function Skeleton() {
  const s = { background: skeletonGradient, borderRadius: 16 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16 }}>
        {[0,1,2,3].map((i) => <div key={i} style={{ ...s, height: 168 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...s, height: 300 }} /><div style={{ ...s, height: 300 }} />
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
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: TEXT_DARK, letterSpacing: "-0.02em" }}>Country Dashboard</h1>
          <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 4 }}>Solar & wind investment snapshot for Europe</p>
        </div>
        <select value={selectedIso} onChange={(e) => setSelectedIso(e.target.value)} className="select-field" aria-label="Select country" style={{ minWidth: 180 }}>
          {countries.map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
        </select>
      </div>
      {loading && <Skeleton />}
      {error && (
        <div style={{ background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.errorRed, borderRadius: 14, padding: "14px 18px", fontSize: 14 }}>
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
      {/* Country badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: GREEN_LIGHT, color: GREEN_DARK,
        borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, width: "fit-content",
      }}>
        📍 {countryName} · Updated {updatedAt}
      </div>

      {/* KPI row — all 4 on one line */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16 }}>
        <HeroKpiCard label="Wind + solar total" value={fmt(total)} unit="MW" sub="Combined renewable capacity for this country" icon="⚡" />
        <KpiCard label="Wind capacity"   value={fmt(windMw)}    unit="MW" sub="Onshore + offshore" topColor={WIND_COLOR}  icon="💨" iconBg={colors.iconBgWind} />
        <KpiCard label="Solar capacity"  value={fmt(solarMw)}   unit="MW" sub="Photovoltaic"       topColor={SOLAR_COLOR} icon="☀️" iconBg={colors.iconBgSolar} />
        <KpiCard label="Share of output" value={shareOfTotal}   unit="%"  sub={`of ${fmt(data.total)} MW total`} topColor={colors.kpiShare} icon="📊" iconBg={colors.iconBgShare} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Full pie with labels inside slices */}
        <Card title="Solar vs wind mix">
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            {[{ color: WIND_COLOR, label: "Wind" }, { color: SOLAR_COLOR, label: "Solar" }].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_MID }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{label}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 140, bottom: 20, left: 20 }}>
              <Pie
                data={pieData}
                cx="40%" cy="50%"
                innerRadius={0} outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={PieSliceLabel}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? WIND_COLOR : SOLAR_COLOR} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar chart with values on top */}
        <Card title="Capacity by source (MW)">
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            {[{ color: WIND_COLOR, label: "Wind" }, { color: SOLAR_COLOR, label: "Solar" }].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_MID }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{label}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 28, right: 24, left: 0, bottom: 0 }} barSize={64}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.trackBg} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: TEXT_MID, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TEXT_MUTED }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.barHoverWash }} />
              <Bar dataKey="mw" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="mw" position="top" content={<BarTopLabel />} />
                {barData.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={index === 0 ? WIND_COLOR : SOLAR_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Investment snapshot */}
      <Card title="Investment snapshot — wind vs solar breakdown">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { label: "Wind (onshore + offshore)", mw: windMw, pct: windPct, color: WIND_COLOR,  bg: colors.iconBgWind, icon: "💨" },
            { label: "Solar (photovoltaic)",       mw: solarMw, pct: solarPct, color: SOLAR_COLOR, bg: colors.iconBgSolar, icon: "☀️" },
          ].map(({ label, mw, pct, color, bg, icon }) => (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{label}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>{fmt(mw)} MW</div>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em", color }}>{pct}%</div>
              </div>
              <div style={{ height: 8, background: colors.trackBg, borderRadius: 5, overflow: "hidden" }}>
                <div className="progress-fill" style={{ width: "100%", height: "100%", background: color, borderRadius: 5, transform: `scaleX(${pct / 100})` }} />
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