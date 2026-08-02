"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function ComparisonLineChart({
  points,
}: {
  points: { label: string; current: number; previous: number }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              padding: "6px 10px",
            }}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (value === "current" ? "This period" : "Last period")}
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="var(--color-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#d2001f"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
