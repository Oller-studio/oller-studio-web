"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function DayOfWeekChart({
  data,
}: {
  data: { day: string; sessions: number }[];
}) {
  const max = Math.max(...data.map((d) => d.sessions), 1);
  const busiest = Math.max(...data.map((d) => d.sessions));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--color-border)", opacity: 0.3 }}
          contentStyle={{
            background: "var(--color-background)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
            padding: "6px 10px",
          }}
        />
        <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.day}
              fill={d.sessions === busiest && max > 0 ? "#d2001f" : "var(--color-foreground)"}
              fillOpacity={d.sessions === busiest && max > 0 ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
