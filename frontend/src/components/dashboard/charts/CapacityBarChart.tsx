import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colors } from "@/lib/tokens";
import { Card } from "../DashboardCards";
import { formatCompactMw, formatMw } from "../dashboardUtils";
import { ChartLegend } from "./ChartLegend";

interface BarDataItem {
  name: string;
  mw: number;
}

interface CapacityBarChartProps {
  data: BarDataItem[];
}

export function CapacityBarChart({ data }: CapacityBarChartProps) {
  return (
    <Card title="Capacity by source (MW)">
      <ChartLegend />

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ top: 28, right: 24, left: 0, bottom: 0 }}
          barSize={64}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.trackBg}
            vertical={false}
          />

          <XAxis
            dataKey="name"
            tick={{
              fontSize: 13,
              fill: colors.slate,
              fontWeight: 600,
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fontSize: 12,
              fill: colors.muted,
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: colors.barHoverWash }}
          />

          <Bar dataKey="mw" radius={[8, 8, 0, 0]}>
            <LabelList dataKey="mw" position="top" content={<BarTopLabel />} />

            {data.map((_, index) => (
              <Cell
                key={`bar-${index}`}
                fill={index === 0 ? colors.indigoDeep : colors.sentryTeal}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
  }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="dashboard-chart-tooltip">
      <div className="dashboard-chart-tooltip-name">{item.name}</div>

      <div className="dashboard-chart-tooltip-value">
        {formatMw(Number(item.value ?? 0))} MW
      </div>
    </div>
  );
}

function BarTopLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}) {
  const { x = 0, y = 0, width = 0, value = 0 } = props;

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fill={colors.slate}
      fontSize={13}
      fontWeight={600}
    >
      {formatCompactMw(value)} MW
    </text>
  );
}
