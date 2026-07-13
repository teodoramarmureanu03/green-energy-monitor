import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colors } from "@/lib/tokens";
import type {
  GenerationHistoryPoint,
  HistoryPeriod,
} from "@/types/contract";

import { Card } from "../DashboardCards";
import {
  formatCompactMw,
  formatMw,
} from "../dashboardUtils";

interface HistoryChartsProps {
  data: GenerationHistoryPoint[];
  period: HistoryPeriod;
}

export function RenewableHistoryChart({
  data,
  period,
}: HistoryChartsProps) {
  return (
    <Card title="Solar and wind production history">
      <ResponsiveContainer width="100%" height={390}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 32,
            bottom: 20,
            left: 8,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.trackBg}
            vertical={false}
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            minTickGap={12}
            tick={{
              fontSize: 12,
              fill: colors.muted,
            }}
          />

          <YAxis
            width={68}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: colors.muted,
            }}
            tickFormatter={(value) =>
              formatCompactMw(Number(value))
            }
          />

          <Tooltip content={<HistoryTooltip />} />

          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            wrapperStyle={{
              fontSize: 12,
              color: colors.slate,
            }}
          />

          <Line
            type="monotone"
            dataKey="windMw"
            name="Wind"
            stroke={colors.indigoDeep}
            strokeWidth={3}
            connectNulls={false}
            dot={{
              r: getDotRadius(period),
              fill: colors.surface,
              stroke: colors.indigoDeep,
              strokeWidth: 3,
            }}
            activeDot={{
              r: 6,
              fill: colors.indigoDeep,
              stroke: colors.surface,
              strokeWidth: 2,
            }}
          />

          <Line
            type="monotone"
            dataKey="solarMw"
            name="Solar"
            stroke={colors.sentryTeal}
            strokeWidth={3}
            connectNulls={false}
            dot={{
              r: getDotRadius(period),
              fill: colors.surface,
              stroke: colors.sentryTeal,
              strokeWidth: 3,
            }}
            activeDot={{
              r: 6,
              fill: colors.sentryTeal,
              stroke: colors.surface,
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function TotalEnergyHistoryChart({
  data,
  period,
}: HistoryChartsProps) {
  return (
    <Card title="Total energy production history">
      <ResponsiveContainer width="100%" height={390}>
        <AreaChart
          data={data}
          margin={{
            top: 20,
            right: 32,
            bottom: 20,
            left: 8,
          }}
        >
          <defs>
            <linearGradient
              id="dashboardTotalEnergyGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={colors.forest}
                stopOpacity={0.3}
              />

              <stop
                offset="95%"
                stopColor={colors.forest}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.trackBg}
            vertical={false}
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            minTickGap={12}
            tick={{
              fontSize: 12,
              fill: colors.muted,
            }}
          />

          <YAxis
            width={68}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: colors.muted,
            }}
            tickFormatter={(value) =>
              formatCompactMw(Number(value))
            }
          />

          <Tooltip content={<HistoryTooltip />} />

          <Area
            type="monotone"
            dataKey="total"
            name="Total production"
            stroke={colors.forest}
            strokeWidth={3}
            fill="url(#dashboardTotalEnergyGradient)"
            connectNulls={false}
            dot={{
              r: getDotRadius(period),
              fill: colors.surface,
              stroke: colors.forest,
              strokeWidth: 3,
            }}
            activeDot={{
              r: 6,
              fill: colors.forest,
              stroke: colors.surface,
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function HistoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    stroke?: string;
    payload?: GenerationHistoryPoint;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const tooltipTitle =
    payload[0].payload?.tooltipLabel ?? label ?? "";

  return (
    <div className="dashboard-history-tooltip">
      <div className="dashboard-history-tooltip-title">
        {tooltipTitle}
      </div>

      {payload.map((item) => (
        <div
          key={item.name}
          className="dashboard-history-tooltip-row"
        >
          <span
            className="dashboard-history-tooltip-dot"
            style={{
              background:
                item.color ??
                item.stroke ??
                colors.forest,
            }}
          />

          <span>{item.name}</span>

          <strong>
            {formatMw(item.value)} MW
          </strong>
        </div>
      ))}
    </div>
  );
}

function getDotRadius(period: HistoryPeriod): number {
  if (period === "year") {
    return 4;
  }

  if (period === "month") {
    return 4;
  }

  return 3.5;
}