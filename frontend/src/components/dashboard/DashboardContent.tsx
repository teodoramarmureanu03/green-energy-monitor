import { useState } from "react";
import type { CSSProperties } from "react";

import type { CountryGeneration, HistoryPeriod } from "@/types/contract";
import { colors } from "@/lib/tokens";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";

import { Card, HeroKpiCard, KpiCard } from "./DashboardCards";
import { CapacityBarChart } from "./charts/CapacityBarChart";
import { SolarWindPieChart } from "./charts/SolarWindPieChart";
import {
  RenewableHistoryChart,
  TotalEnergyHistoryChart,
} from "./charts/HistoryCharts";

import {
  aggregateSources,
  formatDateTime,
  formatMw,
  getSourcePercentages,
  parseHistoryPoints,
} from "./dashboardUtils";

interface DashboardContentProps {
  data: CountryGeneration;
  countryName: string;
  selectedIso: string;
}

export function DashboardContent({
  data,
  countryName,
  selectedIso,
}: DashboardContentProps) {
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>("week");

  const {
    historyByPeriod,
    loading: historyLoading,
    error: historyError,
  } = useGenerationHistory(selectedIso);

  const { windMw, solarMw } = aggregateSources(data.bySource);

  const totalRenewable = windMw + solarMw;
  const shareOfTotal =
    data.total > 0 ? ((totalRenewable / data.total) * 100).toFixed(1) : "—";

  const { windPct, solarPct } = getSourcePercentages(windMw, solarMw);
  const updatedAt = formatDateTime(data.timestamp);
  const historyData = parseHistoryPoints(
    historyByPeriod[historyPeriod],
    historyPeriod
  );

  const pieData = [
    {
      name: "Wind",
      value: Math.round(windMw),
    },
    {
      name: "Solar",
      value: Math.round(solarMw),
    },
  ].filter((item) => item.value > 0);

  const barData = [
    {
      name: "Wind",
      mw: Math.round(windMw),
    },
    {
      name: "Solar",
      mw: Math.round(solarMw),
    },
  ].filter((item) => item.mw > 0);

  const investmentSources = [
    {
      label: "Wind (onshore + offshore)",
      mw: windMw,
      pct: windPct,
      color: colors.indigoDeep,
      iconBg: colors.iconBgWind,
      icon: "💨",
    },
    {
      label: "Solar (photovoltaic)",
      mw: solarMw,
      pct: solarPct,
      color: colors.sentryTeal,
      iconBg: colors.iconBgSolar,
      icon: "☀️",
    },
  ];

  return (
    <div className="dashboard-content">
      <div className="dashboard-country-badge">
        📍 {countryName} · Updated {updatedAt}
      </div>

      <div className="dashboard-kpi-grid">
        <HeroKpiCard
          label="Wind + solar total"
          value={formatMw(totalRenewable)}
          unit="MW"
          sub="Combined renewable capacity for this country"
          icon="⚡"
        />

        <KpiCard
          label="Wind capacity"
          value={formatMw(windMw)}
          unit="MW"
          sub="Onshore + offshore"
          topColor={colors.indigoDeep}
          icon="💨"
          iconBg={colors.iconBgWind}
        />

        <KpiCard
          label="Solar capacity"
          value={formatMw(solarMw)}
          unit="MW"
          sub="Photovoltaic"
          topColor={colors.sentryTeal}
          icon="☀️"
          iconBg={colors.iconBgSolar}
        />

        <KpiCard
          label="Share of output"
          value={shareOfTotal}
          unit="%"
          sub={`of ${formatMw(data.total)} MW total`}
          topColor={colors.kpiShare}
          icon="📊"
          iconBg={colors.iconBgShare}
        />
      </div>

      <div className="dashboard-charts-grid">
        <SolarWindPieChart data={pieData} />

        <CapacityBarChart data={barData} />
      </div>

      <Card title="Production history">
        <div className="dashboard-history-header">
          <div>
            <p className="dashboard-history-title">
              Historical production trend
            </p>

            <p className="dashboard-history-subtitle">
              Compare wind, solar, and total energy production using backend
              history data.
            </p>
          </div>

          <div className="dashboard-history-periods">
            {(["week", "month", "year"] as HistoryPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                className={
                  historyPeriod === period
                    ? "dashboard-history-period dashboard-history-period-active"
                    : "dashboard-history-period"
                }
                onClick={() => setHistoryPeriod(period)}
              >
                {period === "week"
                  ? "Week"
                  : period === "month"
                    ? "Month"
                    : "Year"}
              </button>
            ))}
          </div>
        </div>

        {historyLoading && (
          <div className="dashboard-history-loading">
            Loading history data…
          </div>
        )}

        {historyError && (
          <div className="dashboard-history-error">{historyError}</div>
        )}

        {!historyLoading && !historyError && historyData.length > 0 && (
          <div className="dashboard-history-grid">
            <RenewableHistoryChart
              data={historyData}
              period={historyPeriod}
            />

            <TotalEnergyHistoryChart
              data={historyData}
              period={historyPeriod}
            />
          </div>
        )}

        {!historyLoading && !historyError && historyData.length === 0 && (
          <div className="dashboard-history-empty">
            No history data available for this period.
          </div>
        )}
      </Card>

      <Card title="Investment snapshot — wind vs solar breakdown">
        <div className="dashboard-investment-list">
          {investmentSources.map((source) => (
            <InvestmentSourceRow key={source.label} {...source} />
          ))}
        </div>
      </Card>

      <p className="dashboard-footer">
        Solar & wind data · Energy-Charts.info (CC BY 4.0)
      </p>
    </div>
  );
}

interface InvestmentSourceRowProps {
  label: string;
  mw: number;
  pct: number;
  color: string;
  iconBg: string;
  icon: string;
}

function InvestmentSourceRow({
  label,
  mw,
  pct,
  color,
  iconBg,
  icon,
}: InvestmentSourceRowProps) {
  const sourceStyle = {
    "--source-color": color,
    "--source-icon-bg": iconBg,
    "--source-progress-scale": pct / 100,
  } as CSSProperties;

  return (
    <div style={sourceStyle}>
      <div className="dashboard-investment-row-header">
        <div className="dashboard-investment-source">
          <div className="dashboard-investment-icon">{icon}</div>

          <div>
            <div className="dashboard-investment-label">{label}</div>

            <div className="dashboard-investment-mw">{formatMw(mw)} MW</div>
          </div>
        </div>

        <div className="dashboard-investment-percent">{pct}%</div>
      </div>

      <div className="dashboard-investment-progress">
        <div className="dashboard-investment-progress-fill" />
      </div>
    </div>
  );
}