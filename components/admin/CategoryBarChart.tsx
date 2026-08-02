"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

// Generic labeled-bar chart — used for both "traffic by day of week" and
// "traffic by hour of day" so there's one component to keep in sync instead
// of two near-identical ones.
export function CategoryBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 0);

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
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
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={`${d.label}-${i}`}
              fill={d.value === max && max > 0 ? "#d2001f" : "var(--color-foreground)"}
              fillOpacity={d.value === max && max > 0 ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
