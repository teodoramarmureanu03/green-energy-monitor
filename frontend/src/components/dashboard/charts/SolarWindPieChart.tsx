import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

import { colors } from "@/lib/tokens";
import { Card } from "../DashboardCards";
import { formatCompactMw } from "../dashboardUtils";
import { ChartLegend } from "./ChartLegend";

interface PieDataItem {
  name: string;
  value: number;
}

interface SolarWindPieChartProps {
  data: PieDataItem[];
}

export function SolarWindPieChart({ data }: SolarWindPieChartProps) {
  return (
    <Card title="Solar vs wind mix">
      <ChartLegend />

      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 20, right: 140, bottom: 20, left: 20 }}>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius={0}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={PieSliceLabel}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? colors.indigoDeep : colors.sentryTeal}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

function PieSliceLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  name?: string;
  value?: number;
  percent?: number;
}) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    name = "",
    value = 0,
    percent = 0,
  } = props;

  if (percent < 0.04) {
    return null;
  }

  const RADIAN = Math.PI / 180;
  const compactValue = formatCompactMw(value);
  const percentText = `${(percent * 100).toFixed(0)}%`;

  if (percent >= 0.15) {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text
          x={x}
          y={y - 10}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={12}
          fontWeight={600}
          opacity={0.85}
        >
          {name}
        </text>

        <text
          x={x}
          y={y + 6}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={16}
          fontWeight={700}
        >
          {compactValue} MW
        </text>

        <text
          x={x}
          y={y + 22}
          textAnchor="middle"
          fill="rgba(255,255,255,0.8)"
          fontSize={12}
        >
          {percentText}
        </text>
      </g>
    );
  }

  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);

  const middleX = cx + (outerRadius + 20) * cos;
  const middleY = cy + (outerRadius + 20) * sin;
  const endX = cx + (outerRadius + 55) * cos;
  const endY = cy + (outerRadius + 55) * sin;

  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <line
        x1={cx + outerRadius * cos}
        y1={cy + outerRadius * sin}
        x2={middleX}
        y2={middleY}
        stroke={colors.muted}
        strokeWidth={1.5}
      />

      <line
        x1={middleX}
        y1={middleY}
        x2={endX}
        y2={endY}
        stroke={colors.muted}
        strokeWidth={1.5}
      />

      <circle cx={endX} cy={endY} r={2} fill={colors.muted} />

      <text
        x={endX + (cos >= 0 ? 6 : -6)}
        y={endY - 7}
        textAnchor={textAnchor}
        fill={colors.ink}
        fontSize={12}
        fontWeight={700}
      >
        {name}
      </text>

      <text
        x={endX + (cos >= 0 ? 6 : -6)}
        y={endY + 8}
        textAnchor={textAnchor}
        fill={colors.muted}
        fontSize={11}
      >
        {compactValue} MW · {percentText}
      </text>
    </g>
  );
}