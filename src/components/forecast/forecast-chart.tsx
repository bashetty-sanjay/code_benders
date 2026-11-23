"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/financial/money";
import { formatDayMonth, formatDisplayDate } from "@/components/forecast/format";

export type ForecastChartPoint = {
  date: string;
  incomingPaise: number;
  outgoingPaise: number;
  closingCashPaise: number;
};

type ChartRow = { date: string; projected: number; baseline?: number };

interface ForecastChartProps {
  points: ForecastChartPoint[];
  baselinePoints?: ForecastChartPoint[];
  horizonDays: number;
  /** Name of the main line in the legend and tooltip. */
  primaryLabel?: string;
}

function toRupees(paise: number): number {
  return paise / 100;
}

/** Chart values are rupees; convert back to integer paise before formatINR. */
function formatRupees(value: number): string {
  return formatINR(Math.round(value * 100));
}

type DotProps = { cx?: number; cy?: number; payload?: ChartRow };

/** Red marker on every day whose projected closing cash is below zero. */
function NegativeDot(props: DotProps) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload || payload.projected >= 0) {
    return <g />;
  }
  return <circle cx={cx} cy={cy} r={4} fill="#dc2626" stroke="#ffffff" strokeWidth={1} />;
}

export function ForecastChart({
  points,
  baselinePoints,
  horizonDays,
  primaryLabel = "Projected cash",
}: ForecastChartProps) {
  const rows: ChartRow[] = points.map((point, index) => {
    const row: ChartRow = { date: point.date, projected: toRupees(point.closingCashPaise) };
    const base = baselinePoints?.[index];
    if (base !== undefined) {
      row.baseline = toRupees(base.closingCashPaise);
    }
    return row;
  });

  return (
    <div role="img" aria-label={`Projected cash balance over ${horizonDays} days`}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayMonth}
            minTickGap={24}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={{ stroke: "#334155" }}
            tickLine={{ stroke: "#334155" }}
          />
          <YAxis
            width={110}
            tickFormatter={formatRupees}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={{ stroke: "#334155" }}
            tickLine={{ stroke: "#334155" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#334155",
              borderRadius: "0.75rem",
              color: "#f8fafc",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
            labelFormatter={(label) => formatDisplayDate(String(label))}
            formatter={(value) => (typeof value === "number" ? formatRupees(value) : String(value))}
          />
          <Legend wrapperStyle={{ color: "#94a3b8" }} />
          <ReferenceLine
            y={0}
            stroke="#f43f5e"
            strokeDasharray="4 4"
            label={{ value: "₹0 Floor", position: "insideTopLeft", fill: "#f43f5e", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="projected"
            name={primaryLabel}
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={NegativeDot}
          />
          {baselinePoints !== undefined ? (
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
