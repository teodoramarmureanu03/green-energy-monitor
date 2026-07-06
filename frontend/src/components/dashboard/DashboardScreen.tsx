import { useState } from "react";
import { useGeneration } from "@/hooks/useGeneration";
import { useCountries } from "@/hooks/useCountries";
import type { CountryGeneration, SourceBreakdown } from "@/types/contract";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { colors, shadows } from "@/lib/tokens";
import { Wind, Sun, Zap, BarChart2, MapPin } from "lucide-react";

// ---- Enevo brand colors ----
const WIND_COLOR   = colors.indigoDeep;  // #192168
const SOLAR_COLOR  = colors.sentryTeal;  // #03bdc2
const KPI_WIND     = colors.indigoDeep;
const KPI_SOLAR    = colors.sentryTeal;
const KPI_SHARE    = "#6d4c9e";
const GREEN_DARK   = colors.forest;
const GREEN_LIGHT  = colors.sageTint;
const CARD_BG      = colors.surface;
const TEXT_DARK    = colors.ink;
const TEXT_MID     = colors.slate;
const TEXT_MUTED   = colors.muted;
const BORDER       = colors.borderSage;

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

// ---- Custom label rendered inside donut slices ----
function DonutLabel(props: {
  cx?: number; cy?: number; midAngle?: number; innerRadius?: number;
  outerRadius?: number; name?: string; value?: number; percent?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, name, value, percent = 0 } = props;
  if (percent < 0.05) return null; // hide tiny slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text x={x} y={y - 9} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600} opacity={0.85}>
        {name}
      </text>
      <text x={x} y={y + 8} textAnchor="middle" fill="#fff" fontSize={15} fontWeight={700}>
        {fmtK(value ?? 0)} MW
      </text>
      <text x={x} y={y + 23} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize={11}>
        {(percent * 100).toFixed(0)}%
      </text>
    </g>
  );
}

// ---- Custom bar label (value on top) ----
function BarTopLabel(props: { x?: number; y?: number; width?: number; value?: number }) {
  const { x = 0, y = 0, width = 0, value = 0 } = props;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill={TEXT_MID} fontSize={13} fontWeight={600}>
      {fmtK(value)} MW
    </text>
  );
}

// ---- Hero KPI card ----
function HeroKpiCard({ label, value, unit, sub }: {
  label: string; value: string; unit: string; sub: string;
}) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.indigoDeep} 0%, ${colors.steelNavy} 100%)`,
      borderRadius: 20, padding: "28px 32px", color: "#fff",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      minHeight: 148, boxShadow: shadows.ambientHero,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={18} color={colors.sentryTeal} strokeWidth={2} />
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
function KpiCard({ label, value, unit, sub, accentColor, icon, iconBg }: {
  label: string; value: string; unit: string; sub: string;
  accentColor: string; icon: React.ReactNode; iconBg: string;
}) {
  return (
    <div style={{
      background: CARD_BG, borderRadius: 20, padding: "22px 24px",
      border: `1px solid ${BORDER}`, borderTop: `3px solid ${accentColor}`,
      boxShadow: shadows.ambientCard,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: TEXT_DARK, lineHeight: 1, marginBottom: 4 }}>
        {value}<span style={{ fontSize: 13, fontWeight: 500, color: TEXT_MUTED, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{sub}</div>
    </div>
  );
}

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG, borderRadius: 20, padding: "24px 28px",
      border: `1px solid ${BORDER}`, boxShadow: shadows.ambientCard, ...style,
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT_DARK, letterSpacing: "-0.1px", marginBottom: 20 }}>{title}</h3>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: colors.charcoal, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#fff", boxShadow: shadows.tooltipDark }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{payload[0].name}</div>
      <div style={{ color: "rgba(255,255,255,0.7)" }}>{fmt(payload[0].value)} MW</div>
    </div>
  );
}

function Skeleton() {
  const s = { background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)", borderRadius: 16 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16 }}>
        {[0,1,2,3].map((i) => <div key={i} style={{ ...s, height: 148 }} />)}
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
          {error}
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

  const PIE_COLORS = [WIND_COLOR, SOLAR_COLOR];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Country badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: GREEN_LIGHT, color: GREEN_DARK,
        borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, width: "fit-content",
      }}>
        <MapPin size={13} strokeWidth={2.5} />
        {countryName} · Updated {updatedAt}
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16 }}>
        <HeroKpiCard label="Wind + solar total" value={fmt(total)} unit="MW" sub="Combined renewable capacity for this country" />
        <KpiCard label="Wind capacity" value={fmt(windMw)} unit="MW" sub="Onshore + offshore"
          accentColor={KPI_WIND} iconBg="#eef0f8"
          icon={<Wind size={16} color={KPI_WIND} strokeWidth={2} />} />
        <KpiCard label="Solar capacity" value={fmt(solarMw)} unit="MW" sub="Photovoltaic"
          accentColor={KPI_SOLAR} iconBg="#e6f9fa"
          icon={<Sun size={16} color={KPI_SOLAR} strokeWidth={2} />} />
        <KpiCard label="Share of output" value={shareOfTotal} unit="%" sub={`of ${fmt(data.total)} MW total`}
          accentColor={KPI_SHARE} iconBg="#f0ebf8"
          icon={<BarChart2 size={16} color={KPI_SHARE} strokeWidth={2} />} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Donut with labels inside slices */}
        <Card title="Solar vs wind mix">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={0}
                outerRadius={115}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={DonutLabel}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar chart with values on top */}
        <Card title="Capacity by source (MW)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 28, right: 24, left: 0, bottom: 0 }} barSize={64}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: TEXT_MID, fontWeight: 600 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: TEXT_MUTED }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(25,33,104,0.04)" }} />
              <Bar dataKey="mw" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="mw" position="top" content={<BarTopLabel />} />
                {barData.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
            { label: "Wind (onshore + offshore)", mw: windMw, pct: windPct, color: WIND_COLOR, bg: "#eef0f8", icon: <Wind size={18} color={WIND_COLOR} strokeWidth={2} /> },
            { label: "Solar (photovoltaic)", mw: solarMw, pct: solarPct, color: SOLAR_COLOR, bg: "#e6f9fa", icon: <Sun size={18} color={SOLAR_COLOR} strokeWidth={2} /> },
          ].map(({ label, mw, pct, color, bg, icon }) => (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>{label}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 1 }}>{fmt(mw)} MW</div>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em", color }}>{pct}%</div>
              </div>
              <div style={{ height: 8, background: "#eef0f2", borderRadius: 5, overflow: "hidden" }}>
                <div
                  className="progress-fill"
                  style={{ width: "100%", height: "100%", background: color, borderRadius: 5, transform: `scaleX(${pct / 100})` }}
                />
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
